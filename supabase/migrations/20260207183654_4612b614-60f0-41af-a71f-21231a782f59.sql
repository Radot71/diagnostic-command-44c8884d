
-- Create table for persisting diagnostic reports
CREATE TABLE public.diagnostic_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_name TEXT,
  tier_selected TEXT NOT NULL DEFAULT 'full',
  report_json JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'claude',
  confidence_score INTEGER,
  wizard_data JSONB,
  output_config JSONB
);

-- Enable Row Level Security
ALTER TABLE public.diagnostic_runs ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth configured yet)
CREATE POLICY "Allow public read diagnostic runs"
  ON public.diagnostic_runs FOR SELECT USING (true);

CREATE POLICY "Allow public insert diagnostic runs"
  ON public.diagnostic_runs FOR INSERT WITH CHECK (true);
