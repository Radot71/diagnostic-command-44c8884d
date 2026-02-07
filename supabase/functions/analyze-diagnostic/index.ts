import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// ============================================================================
// Tier-Specific System Prompts
// ============================================================================

const BASE_SYSTEM = `You are a senior CFO advisor and restructuring expert. Your role is to analyze company diagnostic data and produce actionable diagnostic output for CFO-level decision making.

You must respond with a JSON object. Each text section should be in Markdown format.`;

const JSON_SCHEMA_INSTRUCTION = `
Your response must be a valid JSON object with this structure:
{
  "executiveBrief": "markdown string",
  "valueLedger": "markdown string",
  "scenarios": "markdown string",
  "options": "markdown string",
  "executionPlan": "markdown string",
  "evidenceRegister": "markdown string",
  "integrity": {
    "completeness": 0-100,
    "evidenceQuality": 0-100,
    "confidence": 0-100,
    "missingData": ["list", "of", "missing", "items"]
  }
}`;

function getSystemPrompt(tier: string): string {
  switch (tier) {
    case 'prospect':
      return `${BASE_SYSTEM}

OUTPUT SCOPE: Prospect Snapshot ($2,500) — Rapid governance triage.

INSTRUCTIONS:
- executiveBrief: 2-3 paragraph situation overview with "Situation in Plain English" section, "If You Do Nothing" (3 quantified risks), and "First 7 Days" (urgent moves). Keep concise — 1 page equivalent.
- valueLedger: Brief key financial indicators only (cash position, burn rate, runway). No detailed tables.
- scenarios: Omit or provide a single paragraph noting that full scenario analysis is available at Executive tier.
- options: Exactly 3 strategic options with one-line descriptions. No detailed analysis.
- executionPlan: Omit or state "Execution roadmap not included in Prospect tier."
- evidenceRegister: Brief confidence note only.
- integrity: Assess data completeness honestly.

Be specific and quantitative. Focus on the most critical 3 findings.
${JSON_SCHEMA_INSTRUCTION}`;

    case 'executive':
      return `${BASE_SYSTEM}

OUTPUT SCOPE: Executive Snapshot ($10,000) — Board-ready diagnostic.

INSTRUCTIONS:
- executiveBrief: Comprehensive executive summary with stage assessment (Crisis/Degraded/Stable), days-to-critical, and key findings. Include financial impact ranges (P10/P50/P90 where applicable).
- valueLedger: Summary table with asset valuation, liability structure, and value creation opportunities.
- scenarios: Full scenario analysis with Base Case, Upside Case, and Downside Case. Include assumptions, 12-month outlook, and probability estimates.
- options: 4 strategic options with Description, Timeline, Investment Required, Expected Outcome, and Risk Level for each.
- executionPlan: 7-day immediate action plan with checklist items. Note that 30/90-day roadmap is available at Full tier.
- evidenceRegister: Documents received/pending checklist with quality assessment.
- integrity: Thorough assessment with specific missing data items.

Be specific, quantitative, and focus on board-level trade-offs and decision sequencing.
${JSON_SCHEMA_INSTRUCTION}`;

    case 'full':
    default:
      return `${BASE_SYSTEM}

OUTPUT SCOPE: Full Decision Packet ($20,000) — Institutional full diagnostic.

INSTRUCTIONS:
- executiveBrief: Comprehensive multi-paragraph analysis with stage assessment, key findings (5+), and detailed recommendation. Include financial impact ranges.
- valueLedger: Detailed tables for Asset Valuation (Book Value, FMV, Recovery %), Liability Structure (obligations, amounts, priority, maturity), and Value Creation Opportunities.
- scenarios: Full scenario analysis: Base Case, Upside Case, Downside Case with detailed assumptions, 12-month financial outlook, probability estimates, and scenario-specific action triggers.
- options: 4+ strategic options each with comprehensive Description, Timeline, Investment Required, Expected Outcome, Risk Level, Key Dependencies, and Success Metrics.
- executionPlan: Complete execution plan with Immediate Actions (Week 1-2), Short-Term Workstreams (Week 3-8), 30-Day Roadmap, 90-Day Roadmap, Key Milestones table, and KPI dashboard recommendations. Include stakeholder communication templates for Board, Investor, and CFO briefings.
- evidenceRegister: Comprehensive evidence register with documents received (with quality rating), documents pending, evidence quality notes, confidence assessment, and specific recommendations for improving data quality.
- integrity: Thorough and granular assessment.

Produce institutional-quality output suitable for board presentation, lender review, and investment committee consideration. Be exhaustive, quantitative, and actionable.
${JSON_SCHEMA_INSTRUCTION}`;
  }
}

function getMaxTokens(tier: string): number {
  switch (tier) {
    case 'prospect': return 4000;
    case 'executive': return 8000;
    case 'full':
    default: return 12000;
  }
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

    const userPrompt = `Analyze the following company diagnostic data and produce the diagnostic report at the ${tier.toUpperCase()} tier level:

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
