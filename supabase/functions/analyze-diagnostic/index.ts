import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSystemPrompt, getMaxTokens } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DealEconomics {
  dealType: string;
  dealTypeOther?: string;
  enterpriseValue: string;
  equityCheck: string;
  totalDebt: string;
  entryEbitda: string;
  entryLeverage: string;
  ebitdaMargin: string;
  usRevenuePct: string;
  nonUsRevenuePct: string;
  exportExposurePct: string;
  macroSensitivities: string[];
  timeHorizonMonths: number;
}

interface OperatingMetrics {
  annualEbitda?: string;
  grossMargin?: string;
  revenueGrowthYoY?: string;
}

interface WizardData {
  situation: {
    id: string;
    title: string;
    description: string;
    category: string;
    urgency: string;
  } | null;
  companyBasics: {
    companyName: string;
    industry: string;
    revenue: string;
    employees: string;
    founded: string;
  };
  runwayInputs: {
    cashOnHand: string;
    monthlyBurn: string;
    hasDebt: boolean;
    debtAmount: string;
    debtMaturity: string;
  };
  signalChecklist: {
    signals: string[];
    notes: string;
  };
  dealEconomics?: DealEconomics;
  operatingMetrics?: OperatingMetrics;
}

function sanitizeApiKey(raw: string): string {
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(v)) {
    v = v.replace(/^bearer\s+/i, "").trim();
  }
  return v;
}

// ============================================================================
// Deterministic Pre-Computation — all derived values computed here, not by LLM
// ============================================================================

interface DeterministicValues {
  ev: number | null;
  equity: number | null;
  debt: number | null;
  ebitda: number | null;
  ebitdaMargin: number | null;
  cash: number | null;
  burn: number | null;
  runway: number | null;
  entryMultiple: number | null;
  entryLeverage: number | null;
  impliedRevenue: number | null;
  usRevenuePct: number | null;
  nonUsRevenuePct: number | null;
  exportExposurePct: number | null;
}

function computeDeterministicValues(wizardData: WizardData): DeterministicValues {
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

  // Deterministic formulas — MUST match exactly
  const debt = (!isNaN(ev) && !isNaN(equity)) ? ev - equity : NaN;
  const runway = (!isNaN(cash) && !isNaN(burn) && burn > 0) ? cash / burn : NaN;
  const entryMultiple = (!isNaN(ev) && !isNaN(ebitda) && ebitda > 0) ? ev / ebitda : NaN;
  const entryLeverage = (!isNaN(debt) && !isNaN(ebitda) && ebitda > 0) ? debt / ebitda : NaN;
  const impliedRevenue = (!isNaN(ebitda) && !isNaN(ebitdaMargin) && ebitdaMargin > 0) ? ebitda / (ebitdaMargin / 100) : NaN;
  const nonUsRevenuePct = !isNaN(usRevenuePct) ? 100 - usRevenuePct : NaN;

  return {
    ev: isNaN(ev) ? null : ev,
    equity: isNaN(equity) ? null : equity,
    debt: isNaN(debt) ? null : debt,
    ebitda: isNaN(ebitda) ? null : ebitda,
    ebitdaMargin: isNaN(ebitdaMargin) ? null : ebitdaMargin,
    cash: isNaN(cash) ? null : cash,
    burn: isNaN(burn) ? null : burn,
    runway: isNaN(runway) ? null : runway,
    entryMultiple: isNaN(entryMultiple) ? null : entryMultiple,
    entryLeverage: isNaN(entryLeverage) ? null : entryLeverage,
    impliedRevenue: isNaN(impliedRevenue) ? null : impliedRevenue,
    usRevenuePct: isNaN(usRevenuePct) ? null : usRevenuePct,
    nonUsRevenuePct: isNaN(nonUsRevenuePct) ? null : nonUsRevenuePct,
    exportExposurePct: isNaN(exportExposurePct) ? null : exportExposurePct,
  };
}

function fmt(val: number | null, decimals = 1): string {
  return val !== null ? val.toFixed(decimals) : 'UNKNOWN';
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
// Streaming: read Anthropic SSE and forward text deltas to client
// ============================================================================

async function streamAnthropicResponse(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    }),
  });

  if (!anthropicRes.ok) {
    const errorText = await anthropicRes.text();
    console.error("Anthropic API error:", anthropicRes.status, errorText);
    throw new Error(`Anthropic API error [${anthropicRes.status}]`);
  }

  const reader = anthropicRes.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Signal end of stream
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "content_block_delta" && event.delta?.text) {
              // Forward text delta to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            } else if (event.type === "message_start" && event.message) {
              // Forward model info
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ meta: { model: event.message.model } })}\n\n`)
              );
            } else if (event.type === "message_delta" && event.usage) {
              // Forward usage info
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ usage: event.usage })}\n\n`)
              );
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!rawKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "LLM credentials not configured — live analysis unavailable.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = sanitizeApiKey(rawKey);

    const { wizardData, outputMode, tier = "full" } = (await req.json()) as {
      wizardData: WizardData;
      outputMode: string;
      tier?: string;
    };

    if (!wizardData) {
      return new Response(
        JSON.stringify({ success: false, error: "wizardData is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = getSystemPrompt(tier);
    const maxTokens = getMaxTokens(tier);
    const userPrompt = buildUserPrompt(wizardData, tier);

    console.log(`Calling Anthropic API (streaming) — tier: ${tier}, max_tokens: ${maxTokens}`);

    const stream = await streamAnthropicResponse(ANTHROPIC_API_KEY, systemPrompt, userPrompt, maxTokens);

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Analysis could not be completed. Please retry or contact support.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
