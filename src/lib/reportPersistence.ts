import { supabase } from "@/integrations/supabase/client";
import { DiagnosticReport, WizardData, OutputConfig, ReportSource } from './types';

export async function saveReport(params: {
  report: DiagnosticReport;
  wizardData: WizardData;
  outputConfig: OutputConfig;
  source: ReportSource;
}): Promise<string> {
  const { report, wizardData, outputConfig, source } = params;
  const confidenceScore = Math.round(
    (report.integrity.completeness + report.integrity.evidenceQuality + report.integrity.confidence) / 3
  );

  const { data, error } = await supabase
    .from('diagnostic_runs' as any)
    .insert({
      company_name: wizardData.companyBasics.companyName || null,
      tier_selected: outputConfig.tier,
      report_json: report as any,
      source,
      confidence_score: confidenceScore,
      wizard_data: wizardData as any,
      output_config: outputConfig as any,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return (data as any).id;
}

export async function loadReport(id: string): Promise<{
  report: DiagnosticReport;
  wizardData: WizardData;
  outputConfig: OutputConfig;
  source: ReportSource;
} | null> {
  const { data, error } = await supabase
    .from('diagnostic_runs' as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as any;
  return {
    report: row.report_json as DiagnosticReport,
    wizardData: row.wizard_data as WizardData,
    outputConfig: row.output_config as OutputConfig,
    source: row.source as ReportSource,
  };
}
