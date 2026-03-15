import { NextRequest, NextResponse } from 'next/server';
import { convertDocxToPdf } from '@/lib/cloudmersive';
import { convertDocxToPdf as libreOfficeDocxToPdf, isLibreOfficeAvailable } from '@/lib/libreoffice';
import {
  convertDocxToPdfViaConvertAPI,
  convertDocxToPdfViaILovePDF,
} from '@/lib/freeConverters';
import { convertDocxToPdfSync } from '@/lib/renderPdfService';
import { uploadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('wordprocessingml') && !file.name.endsWith('.docx')) {
      return NextResponse.json({ error: 'Only DOCX files are supported' }, { status: 400 });
    }

    const docxBuffer = Buffer.from(await file.arrayBuffer());

    let pdfBuffer: Buffer | undefined;

    // 1. Cloudmersive (primary, 800 total free)
    if (process.env.CLOUDMERSIVE_API_KEY) {
      console.log('🔄 Converting DOCX to PDF using Cloudmersive API...');
      try {
        pdfBuffer = await convertDocxToPdf(docxBuffer);
        console.log('✅ DOCX to PDF conversion successful (Cloudmersive)');
      } catch (err) {
        console.error('❌ Cloudmersive conversion failed:', err);
      }
    }

    // 2. ConvertAPI (250 / month free)
    if (!pdfBuffer && process.env.CONVERTAPI_SECRET) {
      console.log('🔄 Falling back to ConvertAPI...');
      try {
        pdfBuffer = await convertDocxToPdfViaConvertAPI(docxBuffer);
        console.log('✅ DOCX to PDF conversion successful (ConvertAPI)');
      } catch (err) {
        console.error('❌ ConvertAPI conversion failed:', err);
      }
    }

    // 3. iLovePDF (250 / month free)
    if (!pdfBuffer && process.env.ILOVEPDF_PUBLIC_KEY && process.env.ILOVEPDF_SECRET_KEY) {
      console.log('🔄 Falling back to iLovePDF...');
      try {
        pdfBuffer = await convertDocxToPdfViaILovePDF(docxBuffer);
        console.log('✅ DOCX to PDF conversion successful (iLovePDF)');
      } catch (err) {
        console.error('❌ iLovePDF conversion failed:', err);
      }
    }

    // 4. LibreOffice CLI (self-hosted, free — skipped automatically on Vercel)
    if (!pdfBuffer) {
      const hasLibreOffice = await isLibreOfficeAvailable();
      if (hasLibreOffice) {
        console.log('🔄 Falling back to LibreOffice CLI...');
        try {
          pdfBuffer = await libreOfficeDocxToPdf(docxBuffer);
          console.log('✅ DOCX to PDF conversion successful (LibreOffice CLI)');
        } catch (err) {
          console.error('❌ LibreOffice CLI conversion failed:', err);
        }
      }
    }

    // 5. Fly.io render service (paid, last resort)
    if (!pdfBuffer) {
      console.log('🔄 Falling back to Fly.io (last resort)...');
      // Upload DOCX so Fly.io can fetch it by URL
      const tempDocxUrl = await uploadFile(
        docxBuffer,
        'convert-word-to-pdf/temp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      const flyResult = await convertDocxToPdfSync(tempDocxUrl, 60000, 3);
      if (!flyResult.success || !flyResult.pdfBuffer) {
        throw new Error(flyResult.error || 'All PDF conversion methods failed');
      }
      pdfBuffer = Buffer.from(flyResult.pdfBuffer, 'base64');
      console.log('✅ DOCX to PDF conversion successful (Fly.io)');
    }
    
    console.log('📄 Generated PDF buffer size:', pdfBuffer.length, 'bytes');

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file.name.replace('.docx', '.pdf')}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Word to PDF conversion error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to convert Word to PDF' },
      { status: 500 }
    );
  }
}
