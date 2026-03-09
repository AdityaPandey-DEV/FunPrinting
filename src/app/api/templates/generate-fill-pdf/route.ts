import { NextRequest, NextResponse } from 'next/server';
import { fillDocxTemplate } from '@/lib/docxProcessor';
import { uploadFile } from '@/lib/storage';
import { convertDocxToPdfSync } from '@/lib/renderPdfService';
import { convertDocxToPdf as cloudmersiveDocxToPdf } from '@/lib/cloudmersive';
import { v4 as uuidv4 } from 'uuid';
import { jobStore } from '@/lib/jobStore';
import { generationRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/ratelimit';

/**
 * Background PDF conversion — runs after the API response is sent
 * Updates job status in Redis when done
 */
async function convertToPdfInBackground(
  jobId: string,
  filledBuffer: Buffer,
  wordUrl: string
) {
  let pdfUrl: string | undefined;
  let status: 'completed' | 'failed' = 'completed';
  let error: string | undefined;

  const hasCloudmersiveKey = !!process.env.CLOUDMERSIVE_API_KEY;
  let cloudmersiveSucceeded = false;

  // Primary: Cloudmersive API
  if (hasCloudmersiveKey) {
    console.log(`📄 [BG] Job ${jobId}: Converting to PDF via Cloudmersive...`);
    try {
      const pdfBuffer = await cloudmersiveDocxToPdf(filledBuffer);
      pdfUrl = await uploadFile(pdfBuffer, `filled-documents/${jobId}`, 'application/pdf');
      console.log(`✅ [BG] Job ${jobId}: PDF uploaded (Cloudmersive):`, pdfUrl);
      cloudmersiveSucceeded = true;
    } catch (cloudmersiveError) {
      console.error(`❌ [BG] Job ${jobId}: Cloudmersive failed:`, cloudmersiveError);
    }
  }

  // Fallback: Fly.io render service
  if (!cloudmersiveSucceeded) {
    console.log(`📄 [BG] Job ${jobId}: Falling back to Fly.io...`);
    try {
      const conversionResult = await convertDocxToPdfSync(wordUrl, 60000, 3);
      if (conversionResult.success && conversionResult.pdfBuffer) {
        const pdfBuffer = Buffer.from(conversionResult.pdfBuffer, 'base64');
        pdfUrl = await uploadFile(pdfBuffer, `filled-documents/${jobId}`, 'application/pdf');
        console.log(`✅ [BG] Job ${jobId}: PDF uploaded (Fly.io):`, pdfUrl);
      } else {
        status = 'failed';
        error = conversionResult.error || 'PDF conversion failed';
      }
    } catch (flyError) {
      status = 'failed';
      error = flyError instanceof Error ? flyError.message : 'Fly.io fallback failed';
      console.error(`❌ [BG] Job ${jobId}: Fly.io also failed:`, flyError);
    }
  }

  // Update job in Redis with final status
  const existingJob = await jobStore.get(jobId);
  await jobStore.set(jobId, {
    jobId,
    wordUrl,
    pdfUrl,
    status: pdfUrl ? 'completed' : status,
    error: pdfUrl ? undefined : error,
    createdAt: existingJob?.createdAt || Date.now(),
  });

  console.log(`✅ [BG] Job ${jobId}: Final status = ${pdfUrl ? 'completed' : status}`);
}

/**
 * Generate filled Word document and kick off async PDF conversion
 * Returns immediately with jobId — client polls generation-status for updates
 */
export async function POST(request: NextRequest) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimitResponse = await checkRateLimit(generationRateLimit, clientId);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    console.log('📝 Template fill with PDF conversion request received');

    const { templateId, formData } = await request.json();

    console.log('[GENERATE-FILL] Received formData keys:', Object.keys(formData || {}));

    if (!templateId || !formData) {
      return NextResponse.json(
        { success: false, error: 'templateId and formData are required' },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Step 1: Generate Word document
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

    // Store job in Redis as 'processing' BEFORE starting PDF conversion
    await jobStore.set(jobId, {
      jobId,
      wordUrl,
      status: 'processing',
      createdAt: Date.now(),
    });
    console.log(`✅ Job stored in Redis: ${jobId}, status: processing`);

    // Step 2: Kick off PDF conversion in the background (fire-and-forget)
    // This runs after the response is sent — client polls generation-status for updates
    convertToPdfInBackground(jobId, filledBuffer, wordUrl).catch((err) => {
      console.error(`❌ [BG] Unhandled error in background PDF conversion for job ${jobId}:`, err);
    });

    // Return immediately with jobId — client will poll for status
    return NextResponse.json({
      success: true,
      jobId,
      wordUrl,
      status: 'processing',
      message: 'Document generated. PDF conversion in progress...',
    });

  } catch (error) {
    console.error('❌ Error generating document:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate document'
      },
      { status: 500 }
    );
  }
}
