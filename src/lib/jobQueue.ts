/**
 * Client-side job queue API for long-running diagnostic runs.
 * Replaces direct SSE streaming with: start → poll → fetch result.
 */

import { WizardData, DiagnosticReport, DiagnosticTier, ReportProvenance } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type JobStatus = 'QUEUED' | 'RUNNING' | 'EXPORTING' | 'COMPLETE' | 'FAILED' | 'CANCELLED';

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress_pct: number;
  last_event: string;
  ai_status: string | null;
  model_used: string | null;
  attempts: number;
  fail_reason: string | null;
  started_at: string | null;
  updated_at: string;
  created_at: string;
  tier: string;
}

export interface JobResultResponse {
  status: string;
  report: DiagnosticReport;
  provenance: ReportProvenance;
  ai_status: string;
  model_used: string;
  attempts: number;
  fail_reason: string | null;
}

export type ProgressStage = 'precompute' | 'ai-analysis' | 'tier-enforcement' | 'exporting' | 'complete' | 'failed' | 'cancelled';

export interface ProgressUpdate {
  stage: ProgressStage;
  pct: number;
  message: string;
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };
}

/**
 * Start a new diagnostic job. Returns within 200ms.
 */
export async function startDiagnosticJob(params: {
  wizardData: WizardData;
  outputMode: string;
  tier: DiagnosticTier;
  normalizedIntake?: object;
  simulateOverload?: boolean;
}): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/diagnostic-start`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to start' }));
    throw new Error(err.error || 'Failed to start diagnostic job');
  }

  const data = await res.json();
  return data.job_id;
}

/**
 * Poll job status. Fast response.
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/diagnostic-status?job_id=${jobId}`, {
    method: 'GET',
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get status' }));
    throw new Error(err.error || 'Failed to get job status');
  }

  return res.json();
}

/**
 * Fetch completed result. Returns 409 if not ready.
 */
export async function getJobResult(jobId: string): Promise<JobResultResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/diagnostic-result?job_id=${jobId}`, {
    method: 'GET',
    headers: headers(),
  });

  if (res.status === 409) {
    const status = await res.json();
    throw new Error(`Job not complete: ${status.status}`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get result' }));
    throw new Error(err.error || 'Failed to get result');
  }

  return res.json();
}

/**
 * Cancel a running job.
 */
export async function cancelJob(jobId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/diagnostic-cancel`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ job_id: jobId }),
  });
}

/**
 * Map job status to a progress stage for the UI.
 */
export function statusToProgress(status: JobStatusResponse): ProgressUpdate {
  const pct = status.progress_pct;
  const msg = status.last_event;

  switch (status.status) {
    case 'QUEUED':
      return { stage: 'precompute', pct: Math.max(pct, 5), message: msg || 'Queued...' };
    case 'RUNNING':
      if (pct <= 20) return { stage: 'precompute', pct, message: msg };
      if (pct <= 70) return { stage: 'ai-analysis', pct, message: msg };
      return { stage: 'tier-enforcement', pct, message: msg };
    case 'EXPORTING':
      return { stage: 'exporting', pct: Math.max(pct, 85), message: msg || 'Generating exports...' };
    case 'COMPLETE':
      return { stage: 'complete', pct: 100, message: 'Complete' };
    case 'FAILED':
      return { stage: 'failed', pct, message: msg || 'Job failed' };
    case 'CANCELLED':
      return { stage: 'cancelled', pct, message: 'Cancelled' };
    default:
      return { stage: 'precompute', pct, message: msg };
  }
}

/**
 * Poll until COMPLETE/FAILED/CANCELLED. Calls onProgress for UI updates.
 */
export async function pollUntilDone(
  jobId: string,
  onProgress: (update: ProgressUpdate) => void,
  pollIntervalMs = 1500,
  maxWaitMs = 300000, // 5 minutes max
): Promise<JobResultResponse> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = await getJobStatus(jobId);
    const progress = statusToProgress(status);
    onProgress(progress);

    if (status.status === 'COMPLETE') {
      return getJobResult(jobId);
    }

    if (status.status === 'FAILED') {
      throw new Error(status.fail_reason || status.last_event || 'Job failed');
    }

    if (status.status === 'CANCELLED') {
      throw new Error('Job was cancelled');
    }

    await new Promise(r => setTimeout(r, pollIntervalMs));
  }

  throw new Error('Job timed out after 5 minutes');
}
