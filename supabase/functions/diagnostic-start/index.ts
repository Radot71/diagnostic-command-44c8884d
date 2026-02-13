import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wizardData, outputMode = "rapid", tier = "full", normalizedIntake, simulateOverload = false } = await req.json();

    if (!wizardData) {
      return new Response(
        JSON.stringify({ error: "wizardData is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create job record
    const { data: job, error: insertError } = await supabase
      .from("diagnostic_jobs")
      .insert({
        status: "QUEUED",
        tier,
        wizard_data: wizardData,
        normalized_intake: normalizedIntake || null,
        output_mode: outputMode,
        simulate_overload: simulateOverload,
        progress_pct: 0,
        last_event: "Job queued",
      })
      .select("id")
      .single();

    if (insertError || !job) {
      throw new Error(`Failed to create job: ${insertError?.message}`);
    }

    // Fire-and-forget: trigger the worker via edge function call
    const workerUrl = `${supabaseUrl}/functions/v1/diagnostic-worker`;
    fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ job_id: job.id }),
    }).catch((err) => {
      console.error("[start] Failed to trigger worker:", err);
    });

    return new Response(
      JSON.stringify({ job_id: job.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[start] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to start job" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
