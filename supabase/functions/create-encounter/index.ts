import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEncounterRequest {
  session_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id }: CreateEncounterRequest = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ success: false, error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("vai_check_sessions")
      .select("id, provider_id, client_id, status, encounter_id, provider_final_verified, client_final_verified")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: "VAI Check session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.provider_id !== user.id && session.client_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "You are not a participant in this session" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.status !== "completed") {
      return new Response(
        JSON.stringify({ success: false, error: "Session must be completed before creating an encounter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!session.provider_final_verified || !session.client_final_verified) {
      return new Response(
        JSON.stringify({ success: false, error: "Both parties must complete final verification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.encounter_id) {
      return new Response(
        JSON.stringify({
          success: true,
          encounter_id: session.encounter_id,
          message: "Encounter already exists",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: encounter, error: encounterError } = await supabase
      .from("encounters")
      .insert({
        session_id: session.id,
        provider_id: session.provider_id,
        client_id: session.client_id,
        status: "completed",
        accepted_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        reviews_window_open: true,
        dateguard_window_open: true,
      })
      .select()
      .single();

    if (encounterError || !encounter) {
      throw encounterError || new Error("Failed to create encounter");
    }

    await supabase
      .from("vai_check_sessions")
      .update({ encounter_id: encounter.id })
      .eq("id", session.id);

    return new Response(
      JSON.stringify({
        success: true,
        encounter_id: encounter.id,
        message: "Encounter created successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-encounter:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


