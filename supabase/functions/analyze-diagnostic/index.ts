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

const SYSTEM_PROMPT = `You are a senior CFO advisor and restructuring expert. Your role is to analyze company diagnostic data and produce a comprehensive, actionable diagnostic report for CFO-level decision making.

You must respond with a JSON object containing the following sections. Each section should be in Markdown format:

{
  "executiveBrief": "## Executive Brief: [Company Name]\\n\\n### Situation Overview\\n[2-3 paragraph analysis]\\n\\n### Key Findings\\n[Numbered list of 3-5 critical findings]\\n\\n### Recommendation Summary\\n[1-2 paragraph recommendation]",
  
  "valueLedger": "## Value Ledger: [Company Name]\\n\\n### Asset Valuation Summary\\n[Table with Book Value, Estimated FMV, Recovery %]\\n\\n### Liability Structure\\n[Table with obligations, amounts, priority, maturity]\\n\\n### Value Creation Opportunities\\n[Bullet list of opportunities]",
  
  "scenarios": "## Scenario Analysis: [Company Name]\\n\\n### Base Case\\n[Analysis with assumptions, 12-month outlook, probability]\\n\\n### Upside Case\\n[Analysis]\\n\\n### Downside Case\\n[Analysis]\\n\\n### Scenario-Specific Actions\\n[Brief recommendations]",
  
  "options": "## Strategic Options: [Company Name]\\n\\n### Option 1: [Name]\\n[Description, Timeline, Investment Required, Expected Outcome, Risk Level]\\n\\n### Option 2: [Name]\\n[etc.]\\n\\n### Option 3: [Name]\\n[etc.]\\n\\n### Option 4: [Name]\\n[etc.]",
  
  "executionPlan": "## Execution Plan: [Company Name]\\n\\n### Immediate Actions (Week 1-2)\\n[Checklist]\\n\\n### Short-Term Workstreams (Week 3-8)\\n[Workstreams with bullet points]\\n\\n### Key Milestones\\n[Table with Milestone, Target Date, Owner, Status]",
  
  "evidenceRegister": "## Evidence Register: [Company Name]\\n\\n### Documents Received\\n[Table]\\n\\n### Documents Pending\\n[Checklist]\\n\\n### Evidence Quality Notes\\n[Notes]\\n\\n### Confidence Assessment\\n[Assessment paragraph]",
  
  "integrity": {
    "completeness": 0-100,
    "evidenceQuality": 0-100,
    "confidence": 0-100,
    "missingData": ["list", "of", "missing", "data", "items"]
  }
}

Be specific, quantitative where possible, and focus on actionable insights. Use the company's actual data in your analysis. Calculate runway accurately based on cash and burn rate provided.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawKey = Deno.env.get("ANTHROPIC_API_KEY");
    
    if (!rawKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = sanitizeApiKey(rawKey);

    const { wizardData, outputMode } = await req.json() as { wizardData: WizardData; outputMode: string };

    if (!wizardData) {
      return new Response(
        JSON.stringify({ success: false, error: "wizardData is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Analyze the following company diagnostic data and produce a comprehensive CFO diagnostic report:

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

**Output Mode:** ${outputMode} (${outputMode === 'snapshot' ? 'brief overview' : outputMode === 'rapid' ? 'standard analysis' : 'comprehensive deep-dive'})

Please provide your analysis as a JSON object with the sections specified.`;

    console.log("Calling Anthropic API for diagnostic analysis...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [
          { role: "user", content: userPrompt }
        ],
        system: SYSTEM_PROMPT,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Anthropic API error [${response.status}]: ${errorText}` 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse the JSON from Claude's response
    let analysisResult;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:", parseError);
      // Return the raw content for debugging
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to parse AI response",
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
        usage: data.usage
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
