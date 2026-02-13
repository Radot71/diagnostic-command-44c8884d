import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSystemPrompt, getMaxTokens } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// Types
// ============================================================================

interface Provenance {
  ai_status: 'STREAM_OK' | 'STREAM_FAIL_FALLBACK' | 'NON_STREAM_OK' | 'DETERMINISTIC_ONLY';
  model_used: string;
  retry_count: number;
  fail_reason: string;
  timestamp: string;
  tier: string;
}

interface DealEconomics {
  dealType: string;
  dealTypeOther?: string;
  enterpriseValue: string;
  equityCheck: string;
  entryEbitda: string;
  ebitdaMargin: string;
  usRevenuePct: string;
  exportExposurePct: string;
  macroSensitivities: string[];
  timeHorizonMonths: number;
}

interface WizardData {
  situation: { id: string; title: string; description: string; category: string; urgency: string } | null;
  companyBasics: { companyName: string; industry: string; revenue: string; employees: string; founded: string };
  runwayInputs: { cashOnHand: string; monthlyBurn: string; hasDebt: boolean; debtAmount: string; debtMaturity: string };
  signalChecklist: { signals: string[]; notes: string };
  dealEconomics?: DealEconomics;
  operatingMetrics?: { annualEbitda?: string; grossMargin?: string; revenueGrowthYoY?: string };
}

// ============================================================================
// Circuit Breaker (in-memory per isolate)
// ============================================================================

const circuitBreaker = { failures: [] as number[], openUntil: 0 };
const CIRCUIT_WINDOW_MS = 10 * 60 * 1000;
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_OPEN_DURATION_MS = 10 * 60 * 1000;

function recordFailure(): void {
  const now = Date.now();
  circuitBreaker.failures.push(now);
  circuitBreaker.failures = circuitBreaker.failures.filter(t => now - t < CIRCUIT_WINDOW_MS);
  if (circuitBreaker.failures.length >= CIRCUIT_THRESHOLD) {
    circuitBreaker.openUntil = now + CIRCUIT_OPEN_DURATION_MS;
  }
}

function isCircuitOpen(): boolean {
  return Date.now() < circuitBreaker.openUntil;
}

// ============================================================================
// Deterministic Pre-Computation
// ============================================================================

function fmt(val: number | null, decimals = 1): string {
  return val !== null ? val.toFixed(decimals) : 'UNKNOWN';
}

function computeDeterministicValues(wizardData: WizardData) {
  const de = wizardData.dealEconomics;
  const ri = wizardData.runwayInputs;
  const ev = de ? parseFloat(de.enterpriseValue || '') : NaN;
  const equity = de ? parseFloat(de.equityCheck || '') : NaN;
  const ebitda = de ? parseFloat(de.entryEbitda || '') : NaN;
  const ebitdaMargin = de ? parseFloat(de.ebitdaMargin || '') : NaN;
  const cash = ri ? parseFloat(ri.cashOnHand || '') : NaN;
  const burn = ri ? parseFloat(ri.monthlyBurn || '') : NaN;
  const usRevenuePct = de ? parseFloat(de.usRevenuePct || '') : NaN;
  const exportExposurePct = de ? parseFloat(de.exportExposurePct || '') : NaN;
  const debt = (!isNaN(ev) && !isNaN(equity)) ? ev - equity : NaN;
  const runway = (!isNaN(cash) && !isNaN(burn) && burn > 0) ? cash / burn : NaN;
  const entryMultiple = (!isNaN(ev) && !isNaN(ebitda) && ebitda > 0) ? ev / ebitda : NaN;
  const entryLeverage = (!isNaN(debt) && !isNaN(ebitda) && ebitda > 0) ? debt / ebitda : NaN;
  const impliedRevenue = (!isNaN(ebitda) && !isNaN(ebitdaMargin) && ebitdaMargin > 0) ? ebitda / (ebitdaMargin / 100) : NaN;
  const nonUsRevenuePct = !isNaN(usRevenuePct) ? 100 - usRevenuePct : NaN;

  return {
    ev: isNaN(ev) ? null : ev, equity: isNaN(equity) ? null : equity,
    debt: isNaN(debt) ? null : debt, ebitda: isNaN(ebitda) ? null : ebitda,
    ebitdaMargin: isNaN(ebitdaMargin) ? null : ebitdaMargin,
    cash: isNaN(cash) ? null : cash, burn: isNaN(burn) ? null : burn,
    runway: isNaN(runway) ? null : runway, entryMultiple: isNaN(entryMultiple) ? null : entryMultiple,
    entryLeverage: isNaN(entryLeverage) ? null : entryLeverage,
    impliedRevenue: isNaN(impliedRevenue) ? null : impliedRevenue,
    usRevenuePct: isNaN(usRevenuePct) ? null : usRevenuePct,
    nonUsRevenuePct: isNaN(nonUsRevenuePct) ? null : nonUsRevenuePct,
    exportExposurePct: isNaN(exportExposurePct) ? null : exportExposurePct,
  };
}

function buildUserPrompt(wizardData: WizardData, tier: string): string {
  const de = wizardData.dealEconomics;
  const dv = computeDeterministicValues(wizardData);
  return `Analyze the following company diagnostic data and produce the diagnostic report at the ${tier.toUpperCase()} tier level.

Follow the strict 4-room flow exactly: ROOM 1 (Evidence) → ROOM 2 (Patterns) → ROOM 3 (Causal Impact) → ROOM 4 (GCAS). Then apply all Mandatory Upgrades (A-H) and produce all 13 sections.

══════════════════════════════════════════════════
LIVE PE GOVERNOR — CONSISTENCY ENFORCED
══════════════════════════════════════════════════

HARD RULES:
1) Only the values in the OBSERVED table below are OBSERVED facts.
2) Only the values in the INFERRED table below are INFERRED — computed using the exact formulas shown. You MUST use these exact numbers. Do NOT recompute them.
3) If a value is UNKNOWN, label it UNKNOWN. Do NOT substitute benchmarks unless explicitly flagged as [ASSUMED].
4) You MUST NOT introduce any new EBITDA, Debt, EV, or Leverage values. Use only the pre-computed figures.
5) Entry Leverage = Debt / EBITDA = ${fmt(dv.debt)} / ${fmt(dv.ebitda)} = ${fmt(dv.entryLeverage, 2)}x. If you write any other leverage number, you are wrong.

┌──────────────────────────────────────────────────┐
│ OBSERVED VALUES (from intake — do not change)    │
├──────────────────────────┬───────────────────────┤
│ Enterprise Value (EV)    │ $${fmt(dv.ev)}M       │
│ Equity Check             │ $${fmt(dv.equity)}M   │
│ Entry EBITDA             │ $${fmt(dv.ebitda)}M   │
│ EBITDA Margin            │ ${fmt(dv.ebitdaMargin)}%│
│ Cash on Hand             │ $${fmt(dv.cash)}M     │
│ Monthly Burn             │ $${fmt(dv.burn)}M     │
│ US Revenue Mix           │ ${fmt(dv.usRevenuePct, 0)}%│
│ Export Exposure           │ ${fmt(dv.exportExposurePct, 0)}%│
│ Debt Maturity Window     │ ${wizardData.runwayInputs.debtMaturity || 'UNKNOWN'}│
└──────────────────────────┴───────────────────────┘

┌──────────────────────────────────────────────────┐
│ INFERRED VALUES (pre-computed — use exactly)     │
├──────────────────────────┬───────────────────────┤
│ Total Debt (EV-Equity)   │ $${fmt(dv.debt)}M     │
│ Entry Leverage (Debt/EBITDA)│ ${fmt(dv.entryLeverage, 2)}x│
│ Entry Multiple (EV/EBITDA)│ ${fmt(dv.entryMultiple, 2)}x│
│ Runway (Cash/Burn)       │ ${fmt(dv.runway, 1)} months│
│ Implied Revenue          │ $${fmt(dv.impliedRevenue)}M│
│ Non-US Revenue Mix       │ ${fmt(dv.nonUsRevenuePct, 0)}%│
└──────────────────────────┴───────────────────────┘

══════════════════════════════════════════════════

**Company Information:**
- Company Name: ${wizardData.companyBasics.companyName || 'Not specified'}
- Industry: ${wizardData.companyBasics.industry || 'Not specified'}
- Revenue: ${wizardData.companyBasics.revenue || 'Not specified'}
- Employees: ${wizardData.companyBasics.employees || 'Not specified'}
- Founded: ${wizardData.companyBasics.founded || 'Not specified'}

**Situation:**
- Type: ${wizardData.situation?.title || 'General Assessment'}
- Category: ${wizardData.situation?.category || 'Not specified'}
- Urgency: ${wizardData.situation?.urgency || 'medium'}
- Description: ${wizardData.situation?.description || 'Not specified'}

**Deal Economics:**
- Deal Type: ${de?.dealType || 'UNKNOWN'}${de?.dealType === 'other' ? ` (${de.dealTypeOther})` : ''}
- Macro Sensitivities: ${de?.macroSensitivities?.join(', ') || 'None specified'}
- Time Horizon: ${de?.timeHorizonMonths || 36} months

**Operating Metrics (Optional — use if provided):**
- Annual EBITDA: ${wizardData.operatingMetrics?.annualEbitda || 'Not provided'}
- Gross Margin: ${wizardData.operatingMetrics?.grossMargin || 'Not provided'}
- Revenue Growth YoY: ${wizardData.operatingMetrics?.revenueGrowthYoY || 'Not provided'}

**Warning Signals Identified:**
${wizardData.signalChecklist.signals.length > 0 ? wizardData.signalChecklist.signals.map(s => `- ${s}`).join('\n') : '- None selected'}

**Additional Notes:**
${wizardData.signalChecklist.notes || 'None provided'}

**Diagnostic Tier:** ${tier}

DETERMINISTIC SCENARIO BANDS (use exactly):
- Base: EBITDA [${fmt(dv.ebitda !== null ? dv.ebitda * 0.95 : null)}M, ${fmt(dv.ebitda !== null ? dv.ebitda * 1.05 : null)}M], Multiple [4.0x, 4.5x]
- Bear: EBITDA [${fmt(dv.ebitda !== null ? dv.ebitda * 0.75 : null)}M, ${fmt(dv.ebitda !== null ? dv.ebitda * 0.85 : null)}M], Multiple [3.5x, 4.0x]
- Tail: EBITDA [${fmt(dv.ebitda !== null ? dv.ebitda * 0.55 : null)}M, ${fmt(dv.ebitda !== null ? dv.ebitda * 0.65 : null)}M], Multiple [2.5x, 3.5x]
- Equity = max(Scenario_EV - $${fmt(dv.debt)}M debt, 0). No negative equity.

GCAS SCORING INPUTS (pre-answered from intake):
- Q1: Revenue outside US? ${dv.nonUsRevenuePct !== null && dv.nonUsRevenuePct > 0 ? 'Yes' : 'No'} (${fmt(dv.nonUsRevenuePct, 0)}% non-US)
- Q2: Emerging market exposure? Determine from industry + export exposure (${fmt(dv.exportExposurePct, 0)}%)
- Q3: Weaker USD impact? Determine from revenue mix

Please provide your analysis as a JSON object with the sections specified in the system prompt.`;
}

// ============================================================================
// Model Router
// ============================================================================

function sanitizeApiKey(raw: string): string {
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1).trim();
  if (/^bearer\s+/i.test(v)) v = v.replace(/^bearer\s+/i, "").trim();
  return v;
}

interface ModelAttempt { model: string; streaming: boolean; maxTokens: number }

function getModelChain(tier: string, baseMaxTokens: number): ModelAttempt[] {
  return [
    { model: 'claude-sonnet-4-20250514', streaming: true, maxTokens: baseMaxTokens },
    { model: 'claude-3-5-sonnet-20241022', streaming: true, maxTokens: baseMaxTokens },
    { model: 'claude-sonnet-4-20250514', streaming: false, maxTokens: Math.min(baseMaxTokens, tier === 'prospect' ? 4096 : tier === 'executive' ? 8192 : 16384) },
  ];
}

async function callAnthropicRaw(apiKey: string, model: string, systemPrompt: string, userPrompt: string, maxTokens: number, streaming: boolean, maxRetries = 3): Promise<{ response: Response; retryCount: number }> {
  let retryCount = 0;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: maxTokens, stream: streaming, messages: [{ role: "user", content: userPrompt }], system: systemPrompt }),
    });
    if (res.ok) return { response: res, retryCount };
    const errorText = await res.text();
    const isOverloaded = res.status === 529 || res.status === 503 || errorText.includes("Overloaded");
    if (isOverloaded && attempt < maxRetries - 1) {
      retryCount++;
      const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
      console.warn(`[worker-retry] ${model} overloaded (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    if (isOverloaded) recordFailure();
    throw new Error(`Anthropic API error [${res.status}]: ${model}`);
  }
  throw new Error(`Anthropic API failed after retries: ${model}`);
}

async function processStreamingResponse(res: Response): Promise<{ text: string; model: string; hasOverload: boolean }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "", fullText = "", model = "";
  let hasOverload = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        const event = JSON.parse(jsonStr);
        if (event.type === "error") {
          const errMsg = event.error?.message || JSON.stringify(event.error) || "";
          if (errMsg.toLowerCase().includes("overloaded")) { hasOverload = true; break; }
        }
        if (event.type === "content_block_delta" && event.delta?.text) fullText += event.delta.text;
        if (event.type === "message_start" && event.message?.model) model = event.message.model;
      } catch { /* skip */ }
    }
    if (hasOverload) break;
  }
  return { text: fullText, model, hasOverload };
}

// ============================================================================
// Worker Handler
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let jobId: string | undefined;

  try {
    const body = await req.json();
    jobId = body.job_id;

    if (!jobId) {
      return new Response(JSON.stringify({ error: "job_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load job
    const { data: job, error: loadErr } = await supabase.from("diagnostic_jobs").select("*").eq("id", jobId).single();
    if (loadErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if already processed or cancelled
    if (job.status !== "QUEUED") {
      return new Response(JSON.stringify({ status: job.status, message: "Job already processed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const wizardData = job.wizard_data as WizardData;
    const tier = job.tier || "full";
    const normalizedIntake = job.normalized_intake as Record<string, unknown> | null;
    const simulateOverload = job.simulate_overload || false;

    // Update status to RUNNING
    await supabase.from("diagnostic_jobs").update({
      status: "RUNNING",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress_pct: 10,
      last_event: "Deterministic precompute started",
    }).eq("id", jobId);

    // Apply normalizedIntake values to wizardData
    if (normalizedIntake) {
      const obs = normalizedIntake.observed as Record<string, unknown> | undefined;
      if (obs && wizardData.dealEconomics) {
        if (obs.enterpriseValue_m !== undefined) wizardData.dealEconomics.enterpriseValue = String(obs.enterpriseValue_m);
        if (obs.equityCheck_m !== undefined) wizardData.dealEconomics.equityCheck = String(obs.equityCheck_m);
        if (obs.entryEbitda_m !== undefined) wizardData.dealEconomics.entryEbitda = String(obs.entryEbitda_m);
        if (obs.ebitdaMargin_pct !== undefined) wizardData.dealEconomics.ebitdaMargin = String(obs.ebitdaMargin_pct);
        if (obs.usRevenuePct !== undefined) wizardData.dealEconomics.usRevenuePct = String(obs.usRevenuePct);
        if (obs.exportExposurePct !== undefined) wizardData.dealEconomics.exportExposurePct = String(obs.exportExposurePct);
        if (obs.cashOnHand_m !== undefined) wizardData.runwayInputs.cashOnHand = String(obs.cashOnHand_m);
        if (obs.monthlyBurn_m !== undefined) wizardData.runwayInputs.monthlyBurn = String(obs.monthlyBurn_m);
        if (obs.debtMaturityMonths !== undefined) wizardData.runwayInputs.debtMaturity = String(obs.debtMaturityMonths);
      }
    }

    // Build prompts
    const systemPrompt = getSystemPrompt(tier);
    const maxTokens = getMaxTokens(tier);
    const userPrompt = buildUserPrompt(wizardData, tier);

    // Update progress
    await supabase.from("diagnostic_jobs").update({
      progress_pct: 20,
      last_event: "Precompute complete. Starting AI analysis...",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    let analysisText = '';
    let provenance: Provenance;

    // Handle simulate overload
    if (simulateOverload) {
      console.log("[worker] simulateOverload=true — returning DETERMINISTIC_ONLY");
      provenance = {
        ai_status: 'DETERMINISTIC_ONLY',
        model_used: 'none',
        retry_count: 0,
        fail_reason: 'Simulated overload for testing',
        timestamp: new Date().toISOString(),
        tier: tier.toUpperCase(),
      };
    } else if (isCircuitOpen()) {
      console.warn("[worker] Circuit OPEN — returning DETERMINISTIC_ONLY");
      provenance = {
        ai_status: 'DETERMINISTIC_ONLY',
        model_used: 'none',
        retry_count: 0,
        fail_reason: 'Circuit breaker OPEN',
        timestamp: new Date().toISOString(),
        tier: tier.toUpperCase(),
      };
    } else {
      // Check if cancelled before expensive call
      const { data: checkJob } = await supabase.from("diagnostic_jobs").select("status").eq("id", jobId).single();
      if (checkJob?.status === "CANCELLED") {
        return new Response(JSON.stringify({ status: "CANCELLED" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const rawKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!rawKey) {
        provenance = {
          ai_status: 'DETERMINISTIC_ONLY',
          model_used: 'none',
          retry_count: 0,
          fail_reason: 'ANTHROPIC_API_KEY not configured',
          timestamp: new Date().toISOString(),
          tier: tier.toUpperCase(),
        };
      } else {
        const apiKey = sanitizeApiKey(rawKey);
        const chain = getModelChain(tier, maxTokens);
        let totalRetries = 0;
        let lastError = '';

        for (const attempt of chain) {
          // Check cancellation between attempts
          const { data: midCheck } = await supabase.from("diagnostic_jobs").select("status").eq("id", jobId).single();
          if (midCheck?.status === "CANCELLED") {
            return new Response(JSON.stringify({ status: "CANCELLED" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          try {
            console.log(`[worker] Trying ${attempt.model} (streaming=${attempt.streaming}, maxTokens=${attempt.maxTokens})`);
            await supabase.from("diagnostic_jobs").update({
              progress_pct: 40,
              last_event: `AI analysis: trying ${attempt.model}...`,
              updated_at: new Date().toISOString(),
            }).eq("id", jobId);

            const { response, retryCount } = await callAnthropicRaw(apiKey, attempt.model, systemPrompt, userPrompt, attempt.maxTokens, attempt.streaming);
            totalRetries += retryCount;

            if (attempt.streaming) {
              const result = await processStreamingResponse(response);
              if (result.hasOverload) { recordFailure(); lastError = `${attempt.model} overloaded in-stream`; continue; }
              if (!result.text) { lastError = `${attempt.model} returned empty text`; continue; }
              analysisText = result.text;
              provenance = { ai_status: 'STREAM_OK', model_used: result.model || attempt.model, retry_count: totalRetries, fail_reason: 'none', timestamp: new Date().toISOString(), tier: tier.toUpperCase() };
              break;
            } else {
              const data = await response.json();
              const textBlocks = data.content.filter((b: { type: string }) => b.type === 'text');
              const text = textBlocks.map((b: { text?: string }) => b.text || '').join('');
              if (!text) { lastError = `${attempt.model} non-streaming returned empty`; continue; }
              analysisText = text;
              provenance = { ai_status: 'NON_STREAM_OK', model_used: data.model || attempt.model, retry_count: totalRetries, fail_reason: 'none', timestamp: new Date().toISOString(), tier: tier.toUpperCase() };
              break;
            }
          } catch (err) {
            totalRetries++;
            lastError = err instanceof Error ? err.message : String(err);
            console.warn(`[worker] ${attempt.model} failed: ${lastError}`);
            continue;
          }
        }

        // If no provenance set (all failed)
        if (!provenance!) {
          provenance = {
            ai_status: 'DETERMINISTIC_ONLY',
            model_used: 'none',
            retry_count: totalRetries,
            fail_reason: lastError || 'All model attempts exhausted',
            timestamp: new Date().toISOString(),
            tier: tier.toUpperCase(),
          };
        }
      }
    }

    // Update progress
    await supabase.from("diagnostic_jobs").update({
      progress_pct: 70,
      last_event: `AI analysis complete (${provenance!.ai_status}). Building report...`,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Parse analysis or build deterministic-only report
    let reportJson: Record<string, unknown>;

    if (analysisText) {
      try {
        // Parse JSON from AI response
        let cleaned = analysisText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const jsonStart = cleaned.search(/[\{\[]/);
        const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        try { reportJson = JSON.parse(cleaned); } catch {
          cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
          reportJson = JSON.parse(cleaned);
        }
      } catch (parseErr) {
        console.error("[worker] JSON parse failed:", parseErr);
        provenance!.ai_status = 'DETERMINISTIC_ONLY';
        provenance!.fail_reason = 'AI response could not be parsed as JSON';
        reportJson = buildDeterministicReport(wizardData, tier, provenance!);
      }
    } else {
      reportJson = buildDeterministicReport(wizardData, tier, provenance!);
    }

    // Assemble final packet
    const dv = computeDeterministicValues(wizardData);
    const finalReport = {
      id: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      outputMode: job.output_mode || 'rapid',
      provenance: provenance!,
      integrity: (reportJson as any).integrity || { completeness: 40, evidenceQuality: 30, confidence: 35, missingData: ['AI narrative unavailable'] },
      sections: {
        executiveBrief: (reportJson as any).executiveBrief || `Deterministic analysis for ${wizardData.companyBasics.companyName}. AI narrative unavailable.`,
        valueLedger: (reportJson as any).valueLedger || `EV: $${fmt(dv.ev)}M | Debt: $${fmt(dv.debt)}M | Leverage: ${fmt(dv.entryLeverage, 2)}x`,
        scenarios: (reportJson as any).scenarios || 'Scenarios available in deterministic mode only.',
        options: (reportJson as any).options || 'Options analysis requires AI narrative.',
        executionPlan: (reportJson as any).executionPlan || 'Execution plan requires AI narrative.',
        evidenceRegister: (reportJson as any).evidenceRegister || 'Evidence register: deterministic values only.',
        patternAnalysis: (reportJson as any).patternAnalysis,
        causalImpactTable: (reportJson as any).causalImpactTable,
        gcasNarrative: (reportJson as any).gcasNarrative,
        segmentValueMath: (reportJson as any).segmentValueMath,
        courseCorrection: (reportJson as any).courseCorrection,
        checkpointRule: (reportJson as any).checkpointRule,
        financingNarrative: (reportJson as any).financingNarrative,
        preconditionsNarrative: (reportJson as any).preconditionsNarrative,
        governorNarrative: (reportJson as any).governorNarrative,
        selfTestNarrative: (reportJson as any).selfTestNarrative,
      },
      gcas: (reportJson as any).gcasAssessment,
      causalImpactRows: (reportJson as any).causalImpactRows,
      segmentBreakdown: (reportJson as any).segmentBreakdown,
      courseCorrections: (reportJson as any).courseCorrections,
      checkpointGate: (reportJson as any).checkpointGate,
      portfolioRecommendation: (reportJson as any).portfolioRecommendation,
      financingLeverage: (reportJson as any).financingLeverage,
      valueLedgerSummary: (reportJson as any).valueLedgerSummary,
      criticalPreconditions: (reportJson as any).criticalPreconditions,
      governorDecision: (reportJson as any).governorDecision,
      selfTest: (reportJson as any).selfTest,
      inputSummary: `Company: ${wizardData.companyBasics.companyName}, Tier: ${tier}`,
      rawJson: wizardData,
    };

    // Update to EXPORTING
    await supabase.from("diagnostic_jobs").update({
      progress_pct: 85,
      last_event: "Building exports...",
      status: "EXPORTING",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Mark COMPLETE
    await supabase.from("diagnostic_jobs").update({
      status: "COMPLETE",
      progress_pct: 100,
      last_event: "Complete",
      report_json: finalReport,
      provenance: provenance!,
      ai_status: provenance!.ai_status,
      model_used: provenance!.model_used,
      attempts: provenance!.retry_count,
      fail_reason: provenance!.fail_reason === 'none' ? null : provenance!.fail_reason,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    console.log(`[worker] Job ${jobId} completed with status ${provenance!.ai_status}`);

    return new Response(
      JSON.stringify({ status: "COMPLETE", job_id: jobId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[worker] Fatal error:", error);

    if (jobId) {
      await supabase.from("diagnostic_jobs").update({
        status: "FAILED",
        last_event: `Fatal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fail_reason: error instanceof Error ? error.message : 'Unknown error',
        ai_status: 'DETERMINISTIC_ONLY',
        updated_at: new Date().toISOString(),
      }).eq("id", jobId).catch(() => {});
    }

    return new Response(
      JSON.stringify({ error: "Worker failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildDeterministicReport(wizardData: WizardData, tier: string, provenance: Provenance): Record<string, unknown> {
  const dv = computeDeterministicValues(wizardData);
  return {
    executiveBrief: `DETERMINISTIC-ONLY REPORT for ${wizardData.companyBasics.companyName}.\nAI narrative was not available (${provenance.fail_reason}).\nAll financial figures below are computed deterministically and are audit-safe.`,
    valueLedger: `EV: $${fmt(dv.ev)}M | Equity: $${fmt(dv.equity)}M | Debt: $${fmt(dv.debt)}M | EBITDA: $${fmt(dv.ebitda)}M | Leverage: ${fmt(dv.entryLeverage, 2)}x | Multiple: ${fmt(dv.entryMultiple, 2)}x | Runway: ${fmt(dv.runway, 1)} months`,
    scenarios: `Base EBITDA: [${fmt(dv.ebitda !== null ? dv.ebitda * 0.95 : null)}M – ${fmt(dv.ebitda !== null ? dv.ebitda * 1.05 : null)}M]\nBear EBITDA: [${fmt(dv.ebitda !== null ? dv.ebitda * 0.75 : null)}M – ${fmt(dv.ebitda !== null ? dv.ebitda * 0.85 : null)}M]\nTail EBITDA: [${fmt(dv.ebitda !== null ? dv.ebitda * 0.55 : null)}M – ${fmt(dv.ebitda !== null ? dv.ebitda * 0.65 : null)}M]`,
    options: 'Strategic options analysis requires AI narrative synthesis.',
    executionPlan: 'Execution plan requires AI narrative synthesis.',
    evidenceRegister: `Observed: EV, Equity, EBITDA, Cash, Burn\nInferred: Debt, Leverage, Multiple, Runway\nMissing: AI narrative sections`,
    integrity: { completeness: 40, evidenceQuality: 30, confidence: 35, missingData: ['AI narrative unavailable — deterministic core only'] },
  };
}
