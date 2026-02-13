
-- Create diagnostic_jobs table for long-running job queue
CREATE TABLE public.diagnostic_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  tier TEXT NOT NULL DEFAULT 'full',
  progress_pct INTEGER NOT NULL DEFAULT 0,
  last_event TEXT NOT NULL DEFAULT 'Job created',
  
  -- Input data
  wizard_data JSONB NOT NULL,
  normalized_intake JSONB,
  output_mode TEXT NOT NULL DEFAULT 'rapid',
  simulate_overload BOOLEAN NOT NULL DEFAULT false,
  
  -- Result data
  report_json JSONB,
  provenance JSONB,
  
  -- Tracking
  ai_status TEXT,
  model_used TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  fail_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.diagnostic_jobs ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (no auth in this app)
CREATE POLICY "Allow public insert diagnostic_jobs"
ON public.diagnostic_jobs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select diagnostic_jobs"
ON public.diagnostic_jobs FOR SELECT USING (true);

CREATE POLICY "Allow public update diagnostic_jobs"
ON public.diagnostic_jobs FOR UPDATE USING (true);
