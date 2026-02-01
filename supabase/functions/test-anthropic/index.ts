import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sanitizeApiKey(raw: string): string {
  let v = raw.trim();

  // Remove accidental wrapping quotes (common when copying from .env files)
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }

  // Some SDKs use `Authorization: Bearer ...`; users sometimes paste that whole string.
  if (/^bearer\s+/i.test(v)) {
    v = v.replace(/^bearer\s+/i, "").trim();
  }

  return v;
}

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
    console.log(
      "Anthropic key diagnostics:",
      JSON.stringify({
        present: Boolean(ANTHROPIC_API_KEY),
        length: ANTHROPIC_API_KEY.length,
        looks_like_sk_ant: ANTHROPIC_API_KEY.startsWith("sk-ant-"),
      })
    );

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "ANTHROPIC_API_KEY is empty after sanitization" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test the API with a minimal request
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 50,
        messages: [{ role: "user", content: "Say 'API key verified!' in 5 words or less." }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Anthropic API error [${response.status}]: ${errorText}` 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const message = data.content?.[0]?.text || "No response";

    return new Response(
      JSON.stringify({ success: true, message, model: data.model }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Test error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
