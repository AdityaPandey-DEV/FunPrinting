import { NextRequest, NextResponse } from 'next/server';
import { fillDocxTemplate } from '@/lib/docxProcessor';
import { uploadFile } from '@/lib/storage';
import { convertDocxToPdfSync } from '@/lib/renderPdfService';
import { convertDocxToPdf as cloudmersiveDocxToPdf } from '@/lib/cloudmersive';
import { v4 as uuidv4 } from 'uuid';
import { jobStore } from '@/lib/jobStore';

/**
 * Generate filled Word document and convert to PDF
 * Uses Cloudmersive API as primary converter, Fly.io render service as fallback
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Template fill with PDF conversion request received');

    const { templateId, formData } = await request.json();

    console.log('[GENERATE-FILL] Received formData keys:', Object.keys(formData || {}));
    console.log('[GENERATE-FILL] Received formData:', formData);

    if (!templateId || !formData) {
      return NextResponse.json(
        { success: false, error: 'templateId and formData are required' },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Step 1: Generate Word document (reuse existing logic)
    console.log('📄 Step 1: Generating Word document...');

    // Fetch template details
    const origin = new URL(request.url).origin;
    const templateUrl = `${origin}/api/admin/save-template?id=${encodeURIComponent(templateId)}`;

    const templateRes = await fetch(templateUrl);
    if (!templateRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch template details' },
        { status: templateRes.status === 404 ? 404 : 500 }
      );
    }

    const templateJson = await templateRes.json();
    if (!templateJson.success || !templateJson.data?.template?.wordUrl) {
      return NextResponse.json(
        { success: false, error: 'Template or wordUrl not found' },
        { status: 404 }
      );
    }

    const template = templateJson.data.template as { name: string; wordUrl: string; formSchema?: any[]; placeholders?: string[] };
    console.log(`✅ Template found: ${template.name}`);
    console.log('[GENERATE-FILL] Template formSchema:', template.formSchema);
    console.log('[GENERATE-FILL] Template formSchema keys:', template.formSchema?.map((f: any) => f.key) || []);
    console.log('[GENERATE-FILL] Template placeholders:', template.placeholders);
    console.log('[GENERATE-FILL] FormData keys received:', Object.keys(formData));
    console.log('[GENERATE-FILL] Missing fields in formData:',
      template.formSchema?.filter((f: any) => !formData[f.key])?.map((f: any) => f.key) ||
      template.placeholders?.filter((p: string) => !formData[p]) || []
    );

    // Fetch the DOCX file
    const sourceRes = await fetch(template.wordUrl);
    if (!sourceRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch source DOCX' },
        { status: sourceRes.status === 404 ? 404 : 500 }
      );
    }

    const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer());
    console.log(`✅ DOCX file fetched: ${sourceBuffer.length} bytes`);

    // Fill the DOCX with form data
    console.log('🔄 Filling DOCX template with form data...');
    const filledBuffer = await fillDocxTemplate(sourceBuffer, formData);
    console.log(`✅ DOCX template filled: ${filledBuffer.length} bytes`);

    // Upload filled Word document to cloud storage
    console.log('☁️ Uploading filled Word document to storage...');
    const wordUrl = await uploadFile(
      filledBuffer,
      `filled-documents/${jobId}`,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    console.log('✅ Filled Word document uploaded:', wordUrl);

    // Store job in jobStore BEFORE starting PDF conversion
    // This allows polling to start and see the job while PDF conversion is happening
    jobStore.set(jobId, {
      jobId,
      wordUrl,
      status: 'processing', // Set to processing before PDF conversion
      createdAt: Date.now(),
    });
    console.log(`✅ Job stored in jobStore (before PDF conversion): ${jobId}, status: processing, hasWordUrl: ${!!wordUrl}`);

    // Step 2: Convert to PDF — Cloudmersive primary, Fly.io fallback
    let pdfUrl: string | undefined;
    let status: 'processing' | 'completed' | 'failed' = 'completed';
    let error: string | undefined;

    // Primary: Try Cloudmersive API (works directly with buffer, no URL needed)
    const hasCloudmersiveKey = !!process.env.CLOUDMERSIVE_API_KEY;
    let cloudmersiveSucceeded = false;

    if (hasCloudmersiveKey) {
      console.log('📄 Step 2: Converting Word to PDF using Cloudmersive (primary)...');
      console.log(`📊 Word file size: ${filledBuffer.length} bytes`);

      try {
        const pdfBuffer = await cloudmersiveDocxToPdf(filledBuffer);
        console.log(`📊 PDF buffer size: ${pdfBuffer.length} bytes`);

        pdfUrl = await uploadFile(
          pdfBuffer,
          `filled-documents/${jobId}`,
          'application/pdf'
        );
        console.log('✅ PDF uploaded to storage (Cloudmersive):', pdfUrl);
        status = 'completed';
        cloudmersiveSucceeded = true;
      } catch (cloudmersiveError) {
        console.error('❌ Cloudmersive conversion failed:', cloudmersiveError);
        console.log('🔄 Falling back to Fly.io render service...');
      }
    } else {
      console.log('⚠️ CLOUDMERSIVE_API_KEY not configured, using Fly.io render service...');
    }

    // Fallback: Try Fly.io render service if Cloudmersive failed or unavailable
    if (!cloudmersiveSucceeded) {
      console.log('📄 Step 2 (fallback): Converting Word to PDF using Fly.io render service...');
      console.log(`📊 Word file URL: ${wordUrl}`);

      try {
        const conversionResult = await convertDocxToPdfSync(wordUrl, 60000, 3);

        if (conversionResult.success && conversionResult.pdfBuffer) {
          const pdfBuffer = Buffer.from(conversionResult.pdfBuffer, 'base64');
          console.log(`📊 PDF buffer size: ${pdfBuffer.length} bytes`);

          pdfUrl = await uploadFile(
            pdfBuffer,
            `filled-documents/${jobId}`,
            'application/pdf'
          );
          console.log('✅ PDF uploaded to storage (Fly.io fallback):', pdfUrl);
          status = 'completed';
        } else {
          const errorMsg = conversionResult.error || 'PDF conversion failed';
          console.warn('⚠️ Fly.io fallback also failed:', errorMsg);
          status = 'failed';
          error = errorMsg;
        }
      } catch (flyError) {
        console.error('❌ Fly.io fallback conversion failed:', flyError);
        status = 'failed';
        error = flyError instanceof Error ? flyError.message : 'Fly.io fallback failed';
      }
    }

    // Update job status after PDF conversion completes
    // Job was already stored before PDF conversion, now update it with final status
    const existingJob = jobStore.get(jobId);
    jobStore.set(jobId, {
      jobId,
      wordUrl, // Always store wordUrl, even if PDF conversion failed
      pdfUrl,
      status,
      error,
      createdAt: existingJob?.createdAt || Date.now(), // Keep original creation time
    });

    console.log(`✅ Job updated in jobStore: ${jobId}, status: ${status}, hasWordUrl: ${!!wordUrl}, hasPdfUrl: ${!!pdfUrl}`);

    return NextResponse.json({
      success: true,
      jobId,
      wordUrl,
      pdfUrl,
      status,
      error,
      message: pdfUrl
        ? 'Document generated and converted to PDF successfully'
        : 'Document generated successfully (PDF conversion unavailable)'
    });

  } catch (error) {
    console.error('❌ Error generating document with PDF conversion:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate document'
      },
      { status: 500 }
    );
  }
}

