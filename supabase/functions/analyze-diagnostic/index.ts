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
  entryEbitda: string;
  ebitdaMargin: string;
  usRevenuePct: string;
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
// Provenance tracking
// ============================================================================

interface Provenance {
  ai_status: 'STREAM_OK' | 'STREAM_FAIL_FALLBACK' | 'NON_STREAM_OK' | 'DETERMINISTIC_ONLY';
  model_used: string;
  retry_count: number;
  fail_reason: string;
  timestamp: string;
  tier: string;
}

// ============================================================================
// Circuit Breaker — in-memory, resets on cold start
// ============================================================================

interface CircuitState {
  failures: number[];
  openUntil: number;
}

const circuitBreaker: CircuitState = { failures: [], openUntil: 0 };
const CIRCUIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_OPEN_DURATION_MS = 10 * 60 * 1000; // 10 minutes

function recordFailure(): void {
  const now = Date.now();
  circuitBreaker.failures.push(now);
  // Prune old
  circuitBreaker.failures = circuitBreaker.failures.filter(t => now - t < CIRCUIT_WINDOW_MS);
  if (circuitBreaker.failures.length >= CIRCUIT_THRESHOLD) {
    circuitBreaker.openUntil = now + CIRCUIT_OPEN_DURATION_MS;
    console.warn(`[circuit] OPEN — ${circuitBreaker.failures.length} failures in window. Open until ${new Date(circuitBreaker.openUntil).toISOString()}`);
  }
}

function isCircuitOpen(): boolean {
  if (Date.now() < circuitBreaker.openUntil) return true;
  return false;
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
// Model Router — ordered failover with tier-appropriate limits
// ============================================================================

interface ModelAttempt {
  model: string;
  streaming: boolean;
  maxTokens: number;
}

function getModelChain(tier: string, baseMaxTokens: number): ModelAttempt[] {
  return [
    { model: 'claude-sonnet-4-20250514', streaming: true, maxTokens: baseMaxTokens },
    { model: 'claude-3-5-sonnet-20241022', streaming: true, maxTokens: baseMaxTokens },
    { model: 'claude-sonnet-4-20250514', streaming: false, maxTokens: Math.min(baseMaxTokens, tier === 'prospect' ? 4096 : tier === 'executive' ? 8192 : 16384) },
  ];
}

function getTierTimeout(tier: string): number {
  switch (tier) {
    case 'prospect': return 25000;
    case 'executive': return 45000;
    default: return 90000;
  }
}

// ============================================================================
// Anthropic call with retry
// ============================================================================

async function callAnthropicRaw(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  streaming: boolean,
  maxRetries = 3,
): Promise<{ response: Response; retryCount: number }> {
  let retryCount = 0;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: streaming,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      }),
    });

    if (res.ok) return { response: res, retryCount };

    const errorText = await res.text();
    const isOverloaded = res.status === 529 || res.status === 503 || errorText.includes("Overloaded");
    
    if (isOverloaded && attempt < maxRetries - 1) {
      retryCount++;
      const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
      console.warn(`[retry] ${model} overloaded (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    if (isOverloaded) {
      recordFailure();
    }

    throw new Error(`Anthropic API error [${res.status}]: ${model}`);
  }
  throw new Error(`Anthropic API failed after retries: ${model}`);
}

// ============================================================================
// Parse non-streaming response
// ============================================================================

function parseNonStreamingResponse(data: { content: Array<{ type: string; text?: string }>; model: string }): { text: string; model: string } {
  const textBlocks = data.content.filter((b: { type: string }) => b.type === 'text');
  const text = textBlocks.map((b: { text?: string }) => b.text || '').join('');
  return { text, model: data.model };
}

// ============================================================================
// Process streaming response — collect and replay
// ============================================================================

async function processStreamingResponse(
  res: Response,
): Promise<{ text: string; model: string; hasOverload: boolean }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let model = "";
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
          if (errMsg.toLowerCase().includes("overloaded")) {
            hasOverload = true;
            break;
          }
        }
        if (event.type === "content_block_delta" && event.delta?.text) {
          fullText += event.delta.text;
        }
        if (event.type === "message_start" && event.message?.model) {
          model = event.message.model;
        }
      } catch { /* skip */ }
    }
    if (hasOverload) break;
  }

  return { text: fullText, model, hasOverload };
}

// ============================================================================
// Main model router — tries chain, returns text + provenance
// ============================================================================

async function routeModelCall(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  tier: string,
  baseMaxTokens: number,
): Promise<{ text: string; provenance: Provenance }> {
  const chain = getModelChain(tier, baseMaxTokens);
  const wallClockLimit = getTierTimeout(tier);
  const startTime = Date.now();
  let totalRetries = 0;
  let lastError = '';

  for (const attempt of chain) {
    if (Date.now() - startTime > wallClockLimit) {
      console.warn(`[router] Wall-clock limit (${wallClockLimit}ms) exceeded, stopping model attempts`);
      break;
    }

    try {
      console.log(`[router] Trying ${attempt.model} (streaming=${attempt.streaming}, maxTokens=${attempt.maxTokens})`);
      
      const { response, retryCount } = await callAnthropicRaw(
        apiKey, attempt.model, systemPrompt, userPrompt, attempt.maxTokens, attempt.streaming,
      );
      totalRetries += retryCount;

      if (attempt.streaming) {
        const result = await processStreamingResponse(response);
        if (result.hasOverload) {
          recordFailure();
          lastError = `${attempt.model} overloaded in-stream`;
          console.warn(`[router] ${lastError}`);
          continue;
        }
        if (!result.text) {
          lastError = `${attempt.model} returned empty text`;
          continue;
        }
        return {
          text: result.text,
          provenance: {
            ai_status: 'STREAM_OK',
            model_used: result.model || attempt.model,
            retry_count: totalRetries,
            fail_reason: 'none',
            timestamp: new Date().toISOString(),
            tier: tier.toUpperCase(),
          },
        };
      } else {
        // Non-streaming
        const data = await response.json();
        const result = parseNonStreamingResponse(data);
        if (!result.text) {
          lastError = `${attempt.model} non-streaming returned empty`;
          continue;
        }
        return {
          text: result.text,
          provenance: {
            ai_status: 'NON_STREAM_OK',
            model_used: result.model || attempt.model,
            retry_count: totalRetries,
            fail_reason: 'none',
            timestamp: new Date().toISOString(),
            tier: tier.toUpperCase(),
          },
        };
      }
    } catch (err) {
      totalRetries++;
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[router] ${attempt.model} failed: ${lastError}`);
      continue;
    }
  }

  // All attempts failed — return deterministic-only signal
  return {
    text: '',
    provenance: {
      ai_status: 'DETERMINISTIC_ONLY',
      model_used: 'none',
      retry_count: totalRetries,
      fail_reason: lastError || 'All model attempts exhausted',
      timestamp: new Date().toISOString(),
      tier: tier.toUpperCase(),
    },
  };
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

    const { wizardData, outputMode, tier = "full", normalizedIntake, simulateOverload } = (await req.json()) as {
      wizardData: WizardData;
      outputMode: string;
      tier?: string;
      normalizedIntake?: Record<string, unknown>;
      simulateOverload?: boolean;
    };

    if (!wizardData) {
      return new Response(
        JSON.stringify({ success: false, error: "wizardData is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If normalizedIntake is provided, inject its values into wizardData for prompt building
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

    const systemPrompt = getSystemPrompt(tier);
    const maxTokens = getMaxTokens(tier);
    const userPrompt = buildUserPrompt(wizardData, tier);
    const encoder = new TextEncoder();

    // ---- Simulate overload for testing ----
    if (simulateOverload) {
      console.log("[router] simulateOverload=true — returning DETERMINISTIC_ONLY");
      const provenance: Provenance = {
        ai_status: 'DETERMINISTIC_ONLY',
        model_used: 'none',
        retry_count: 0,
        fail_reason: 'Simulated overload for testing',
        timestamp: new Date().toISOString(),
        tier: tier.toUpperCase(),
      };
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ provenance })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "SIMULATED_OVERLOAD: All models unavailable" })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      });
    }

    // ---- Check circuit breaker ----
    if (isCircuitOpen()) {
      console.warn("[router] Circuit OPEN — returning DETERMINISTIC_ONLY");
      const provenance: Provenance = {
        ai_status: 'DETERMINISTIC_ONLY',
        model_used: 'none',
        retry_count: 0,
        fail_reason: 'Circuit breaker OPEN — too many recent failures',
        timestamp: new Date().toISOString(),
        tier: tier.toUpperCase(),
      };
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ provenance })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "CIRCUIT_OPEN: Model calls temporarily suspended due to repeated failures" })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      });
    }

    console.log(`[router] Starting model chain — tier: ${tier}, max_tokens: ${maxTokens}, normalizedIntake: ${normalizedIntake ? 'yes' : 'no'}`);

    const { text, provenance } = await routeModelCall(ANTHROPIC_API_KEY, systemPrompt, userPrompt, tier, maxTokens);

    // Build SSE stream with provenance + text (or error)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Always emit provenance first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ provenance })}\n\n`));

        if (text) {
          // Emit model metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: { model: provenance.model_used } })}\n\n`));
          // Chunk text into SSE events (simulate streaming for non-stream responses)
          const chunkSize = 200;
          for (let i = 0; i < text.length; i += chunkSize) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: text.slice(i, i + chunkSize) })}\n\n`));
          }
        } else {
          // All models failed
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `All model attempts failed: ${provenance.fail_reason}` })}\n\n`));
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

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
