/**
 * Free-tier DOCX → PDF converters
 *
 * Priority order (used in route handlers):
 *   1. Cloudmersive  (800 total free — handled in cloudmersive.ts)
 *   2. ConvertAPI    (250 / month free — this file)
 *   3. iLovePDF      (250 / month free — this file)
 *   4. LibreOffice CLI (self-hosted, free — libreoffice.ts)
 *   5. Fly.io        (paid, last resort — renderPdfService.ts)
 *
 * Each converter requires specific env vars:
 *   CONVERTAPI_SECRET        — https://www.convertapi.com  (free account → 250 conversions/month)
 *   ILOVEPDF_PUBLIC_KEY      — https://developer.ilovepdf.com (free account → 250 files/month)
 *   ILOVEPDF_SECRET_KEY
 */

// ─────────────────────────────────────────────────────────
// ConvertAPI
// ─────────────────────────────────────────────────────────

/**
 * Convert a DOCX buffer to PDF using ConvertAPI free tier.
 * Requires env: CONVERTAPI_SECRET
 */
export async function convertDocxToPdfViaConvertAPI(
  docxBuffer: Buffer
): Promise<Buffer> {
  const secret = process.env.CONVERTAPI_SECRET;
  if (!secret) {
    throw new Error('CONVERTAPI_SECRET is not configured');
  }

  console.log('🔄 Converting DOCX to PDF via ConvertAPI...');

  // Step 1 — upload the DOCX file
  const uploadForm = new FormData();
  const blob = new Blob([docxBuffer.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  uploadForm.append('File', blob, 'document.docx');

  const uploadRes = await fetch(
    `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${secret}&StoreFile=true`,
    {
      method: 'POST',
      body: uploadForm,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text().catch(() => 'Unknown error');
    throw new Error(`ConvertAPI upload failed: ${uploadRes.status} – ${errorText}`);
  }

  const result = await uploadRes.json();

  // ConvertAPI returns { Files: [{ FileData: "<base64>" | null, Url: "..." }] }
  const files: Array<{ FileData?: string; Url?: string }> = result?.Files ?? [];
  if (!files.length) {
    throw new Error('ConvertAPI returned no output files');
  }

  const file = files[0];

  // Prefer inline base64 data if available
  if (file.FileData) {
    console.log('✅ PDF received (ConvertAPI, base64 inline)');
    return Buffer.from(file.FileData, 'base64');
  }

  // Otherwise download from the returned URL
  if (file.Url) {
    const downloadRes = await fetch(file.Url);
    if (!downloadRes.ok) {
      throw new Error(`ConvertAPI download failed: ${downloadRes.status}`);
    }
    console.log('✅ PDF received (ConvertAPI, URL download)');
    return Buffer.from(await downloadRes.arrayBuffer());
  }

  throw new Error('ConvertAPI returned a file with neither FileData nor Url');
}

// ─────────────────────────────────────────────────────────
// iLovePDF
// ─────────────────────────────────────────────────────────

/**
 * Convert a DOCX buffer to PDF using the iLovePDF API free tier.
 * Requires env: ILOVEPDF_PUBLIC_KEY + ILOVEPDF_SECRET_KEY
 *
 * Flow:
 *   1. POST /auth  (get JWT)
 *   2. POST /start/officepdf  (create task, get server + task_id)
 *   3. POST /upload  (upload DOCX to the task's server)
 *   4. POST /process  (convert)
 *   5. GET  /download/{task_id}  (download PDF)
 */
export async function convertDocxToPdfViaILovePDF(
  docxBuffer: Buffer
): Promise<Buffer> {
  const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
  const secretKey = process.env.ILOVEPDF_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error('ILOVEPDF_PUBLIC_KEY and/or ILOVEPDF_SECRET_KEY are not configured');
  }

  const API_BASE = 'https://api.ilovepdf.com/v1';

  console.log('🔄 Converting DOCX to PDF via iLovePDF...');

  // ── Step 1: Authenticate ──────────────────────────────
  const authRes = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_key: publicKey }),
  });

  if (!authRes.ok) {
    const errText = await authRes.text().catch(() => 'Unknown error');
    throw new Error(`iLovePDF auth failed: ${authRes.status} – ${errText}`);
  }

  const { token } = await authRes.json() as { token: string };
  const authHeader = { Authorization: `Bearer ${token}` };

  // ── Step 2: Start task ────────────────────────────────
  const startRes = await fetch(`${API_BASE}/start/officepdf`, {
    method: 'GET',
    headers: authHeader,
  });

  if (!startRes.ok) {
    const errText = await startRes.text().catch(() => 'Unknown error');
    throw new Error(`iLovePDF start task failed: ${startRes.status} – ${errText}`);
  }

  const { server, task: taskId } = await startRes.json() as {
    server: string;
    task: string;
  };
  const taskBase = `https://${server}/v1`;

  // ── Step 3: Upload file ───────────────────────────────
  const uploadForm = new FormData();
  const blob = new Blob([docxBuffer.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  uploadForm.append('task', taskId);
  uploadForm.append('file', blob, 'document.docx');

  const uploadRes = await fetch(`${taskBase}/upload`, {
    method: 'POST',
    headers: authHeader,
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => 'Unknown error');
    throw new Error(`iLovePDF upload failed: ${uploadRes.status} – ${errText}`);
  }

  const { server_filename } = await uploadRes.json() as { server_filename: string };

  // ── Step 4: Process ───────────────────────────────────
  const processBody = {
    task: taskId,
    tool: 'officepdf',
    files: [{ server_filename, filename: 'document.docx' }],
  };

  const processRes = await fetch(`${taskBase}/process`, {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(processBody),
  });

  if (!processRes.ok) {
    const errText = await processRes.text().catch(() => 'Unknown error');
    throw new Error(`iLovePDF process failed: ${processRes.status} – ${errText}`);
  }

  // ── Step 5: Download ──────────────────────────────────
  const downloadRes = await fetch(`${taskBase}/download/${taskId}`, {
    method: 'GET',
    headers: authHeader,
  });

  if (!downloadRes.ok) {
    const errText = await downloadRes.text().catch(() => 'Unknown error');
    throw new Error(`iLovePDF download failed: ${downloadRes.status} – ${errText}`);
  }

  const pdfArrayBuffer = await downloadRes.arrayBuffer();
  console.log('✅ PDF received (iLovePDF)');
  return Buffer.from(pdfArrayBuffer);
}
