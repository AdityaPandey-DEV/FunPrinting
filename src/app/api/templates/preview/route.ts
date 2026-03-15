import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DynamicTemplate from '@/models/DynamicTemplate';
import { fillDocxTemplate, validateFormData } from '@/lib/docxProcessor';
import { convertDocxToPdf } from '@/lib/cloudmersive';
import { convertDocxToPdfSync } from '@/lib/renderPdfService';
import {
  convertDocxToPdfViaConvertAPI,
  convertDocxToPdfViaILovePDF,
} from '@/lib/freeConverters';
import { convertDocxToPdf as libreOfficeDocxToPdf, isLibreOfficeAvailable } from '@/lib/libreoffice';
import { uploadFile } from '@/lib/storage';
import { generationRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimitResponse = await checkRateLimit(generationRateLimit, clientId);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const {
      templateId,
      formData,
      previewType = 'docx' // 'docx' or 'pdf'
    } = body;

    if (!templateId || !formData) {
      return NextResponse.json(
        { success: false, error: 'Template ID and form data are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Generating ${previewType.toUpperCase()} preview for template: ${templateId}`);

    // Connect to database
    await connectDB();

    // Fetch template from database
    const template = await DynamicTemplate.findOne({ id: templateId });
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Generate form schema and validate form data
    const formSchema = template.placeholders.map((placeholder: string) => ({
      key: placeholder,
      type: 'text',
      required: true
    }));

    const validation = validateFormData(formData, formSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid form data', details: validation.errors },
        { status: 400 }
      );
    }

    // Download DOCX template from Cloudinary
    console.log('📥 Downloading DOCX template from Cloudinary...');
    const docxResponse = await fetch(template.wordUrl);
    if (!docxResponse.ok) {
      throw new Error('Failed to fetch DOCX template from Cloudinary');
    }
    const docxBuffer = Buffer.from(await docxResponse.arrayBuffer());

    // Fill DOCX template with form data
    console.log('✏️ Filling DOCX template with form data...');
    const filledDocxBuffer = await fillDocxTemplate(docxBuffer, formData);

    let previewUrl: string;
    let contentType: string;
    let fileName: string;

    if (previewType === 'pdf') {
      // Convert filled DOCX to PDF — full fallback chain
      console.log('🔄 Converting filled DOCX to PDF...');
      let pdfBuffer: Buffer | undefined;

      // 1. Cloudmersive (primary, 800 total free)
      if (process.env.CLOUDMERSIVE_API_KEY) {
        try {
          pdfBuffer = await convertDocxToPdf(filledDocxBuffer);
          console.log('✅ PDF conversion successful (Cloudmersive)');
        } catch (err) {
          console.error('❌ Cloudmersive conversion failed:', err);
        }
      }

      // 2. ConvertAPI (250 / month free)
      if (!pdfBuffer && process.env.CONVERTAPI_SECRET) {
        console.log('🔄 Falling back to ConvertAPI...');
        try {
          pdfBuffer = await convertDocxToPdfViaConvertAPI(filledDocxBuffer);
          console.log('✅ PDF conversion successful (ConvertAPI)');
        } catch (err) {
          console.error('❌ ConvertAPI conversion failed:', err);
        }
      }

      // 3. iLovePDF (250 / month free)
      if (!pdfBuffer && process.env.ILOVEPDF_PUBLIC_KEY && process.env.ILOVEPDF_SECRET_KEY) {
        console.log('🔄 Falling back to iLovePDF...');
        try {
          pdfBuffer = await convertDocxToPdfViaILovePDF(filledDocxBuffer);
          console.log('✅ PDF conversion successful (iLovePDF)');
        } catch (err) {
          console.error('❌ iLovePDF conversion failed:', err);
        }
      }

      // 4. LibreOffice CLI (self-hosted, free — skipped on Vercel)
      if (!pdfBuffer) {
        const hasLibreOffice = await isLibreOfficeAvailable();
        if (hasLibreOffice) {
          console.log('🔄 Falling back to LibreOffice CLI...');
          try {
            pdfBuffer = await libreOfficeDocxToPdf(filledDocxBuffer);
            console.log('✅ PDF conversion successful (LibreOffice CLI)');
          } catch (err) {
            console.error('❌ LibreOffice CLI conversion failed:', err);
          }
        }
      }

      // 5. Fly.io render service (paid, last resort)
      if (!pdfBuffer) {
        console.log('🔄 Falling back to Fly.io (last resort)...');
        // Upload DOCX first so Fly.io can fetch it by URL
        const tempDocxUrl = await uploadFile(
          filledDocxBuffer,
          'previews/temp-docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        const flyResult = await convertDocxToPdfSync(tempDocxUrl, 60000, 3);
        if (!flyResult.success || !flyResult.pdfBuffer) {
          throw new Error(flyResult.error || 'All PDF conversion methods failed');
        }
        pdfBuffer = Buffer.from(flyResult.pdfBuffer, 'base64');
        console.log('✅ PDF conversion successful (Fly.io)');
      }

      // Upload PDF to storage
      previewUrl = await uploadFile(
        pdfBuffer,
        'previews/pdf',
        'application/pdf'
      );
      contentType = 'application/pdf';
      fileName = 'preview-document.pdf';
    } else {
      // Upload filled DOCX to storage
      previewUrl = await uploadFile(
        filledDocxBuffer,
        'previews/docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileName = 'preview-document.docx';
    }

    console.log(`✅ Preview generated successfully: ${previewUrl}`);

    return NextResponse.json({
      success: true,
      previewUrl,
      contentType,
      fileName,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error generating preview:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Template preview API is running',
    timestamp: new Date().toISOString()
  });
}
