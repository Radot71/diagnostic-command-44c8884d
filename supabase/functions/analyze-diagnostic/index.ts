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

function buildUserPrompt(wizardData: WizardData, tier: string): string {
  const de = wizardData.dealEconomics;
  const debtVal = de?.totalDebt || (de ? String(parseFloat(de.enterpriseValue || '0') - parseFloat(de.equityCheck || '0')) : 'UNKNOWN');
  const leverageVal = de?.entryLeverage || (de && parseFloat(de.entryEbitda || '0') > 0 ? (parseFloat(debtVal) / parseFloat(de.entryEbitda)).toFixed(1) : 'UNKNOWN');

  return `Analyze the following company diagnostic data and produce the diagnostic report at the ${tier.toUpperCase()} tier level.

Follow the strict 4-room flow exactly: ROOM 1 (Evidence) → ROOM 2 (Patterns) → ROOM 3 (Causal Impact) → ROOM 4 (GCAS). Then apply all Mandatory Upgrades (A-H) and produce all 13 sections.

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

**Financial Position:**
- Cash on Hand: ${wizardData.runwayInputs.cashOnHand || 'Not specified'}
- Monthly Burn Rate: ${wizardData.runwayInputs.monthlyBurn || 'Not specified'}
- Has Debt: ${wizardData.runwayInputs.hasDebt ? 'Yes' : 'No'}
${wizardData.runwayInputs.hasDebt ? `- Debt Amount: ${wizardData.runwayInputs.debtAmount}
- Debt Maturity: ${wizardData.runwayInputs.debtMaturity}` : ''}

**Deal Economics (Deterministic Inputs):**
- Deal Type: ${de?.dealType || 'UNKNOWN'}${de?.dealType === 'other' ? ` (${de.dealTypeOther})` : ''}
- Enterprise Value: $${de?.enterpriseValue || 'UNKNOWN'}M
- Equity Check: $${de?.equityCheck || 'UNKNOWN'}M
- Total Debt: $${debtVal}M
- Entry EBITDA: $${de?.entryEbitda || 'UNKNOWN'}M
- Entry Leverage: ${leverageVal}x
- EBITDA Margin: ${de?.ebitdaMargin || 'UNKNOWN'}%
- US Revenue Mix: ${de?.usRevenuePct || 'UNKNOWN'}%
- Non-US Revenue Mix: ${de ? String(100 - parseFloat(de.usRevenuePct || '0')) : 'UNKNOWN'}%
- Export Exposure: ${de?.exportExposurePct || 'UNKNOWN'}%
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

IMPORTANT: Use the Deal Economics data above as deterministic inputs for GCAS scoring (Q1: revenue outside US = ${de && parseFloat(de.usRevenuePct || '100') < 100 ? 'Yes' : 'No'}), segment-level value math, financing/leverage analysis, and value ledger calculations. Do NOT estimate what is already provided — compute from these numbers.

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
