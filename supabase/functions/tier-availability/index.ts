import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase.from("tier_availability").select("*");

    if (error) {
      throw error;
    }

    const availability = {
      founding_council: { total: 1000, remaining: 1000 },
      first_movers: { total: 2000, remaining: 2000 },
      early_access: { total: 7000, remaining: 7000 },
    };

    data?.forEach((row) => {
      if (availability[row.tier as keyof typeof availability]) {
        availability[row.tier as keyof typeof availability].remaining = row.remaining;
      }
    });

    return new Response(JSON.stringify(availability), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Tier availability error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get availability" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

