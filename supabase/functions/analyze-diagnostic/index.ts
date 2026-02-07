import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSystemPrompt, getMaxTokens } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  return `Analyze the following company diagnostic data and produce the diagnostic report at the ${tier.toUpperCase()} tier level.

Follow the 7-step layered framework exactly: Evidence Layer → Pattern Layer → Causal Layer → GCAS Module → Value Translation → 90-Day Course Correction → Final Output.

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

**Warning Signals Identified:**
${wizardData.signalChecklist.signals.length > 0 ? wizardData.signalChecklist.signals.map(s => `- ${s}`).join('\n') : '- None selected'}

**Additional Notes:**
${wizardData.signalChecklist.notes || 'None provided'}

**Diagnostic Tier:** ${tier}

Please provide your analysis as a JSON object with the sections specified in the system prompt.`;
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
          error: "LLM credentials not configured — live analysis unavailable." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = sanitizeApiKey(rawKey);

    const { wizardData, outputMode, tier = 'full' } = await req.json() as { 
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

    console.log(`Calling Anthropic API — tier: ${tier}, max_tokens: ${maxTokens}`);

    // Claude Sonnet 4 is the SOLE LLM — no other providers permitted
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [
          { role: "user", content: userPrompt }
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Analysis could not be completed. Please retry or contact support. [${response.status}]`
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse the JSON from Claude's response
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Analysis could not be completed. Please retry or contact support.",
          rawContent: content 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisResult,
        model: data.model,
        usage: data.usage,
        tier,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Analysis could not be completed. Please retry or contact support."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
