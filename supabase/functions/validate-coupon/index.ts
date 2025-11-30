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

    const { coupon_code } = await req.json();

    if (!coupon_code) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon code required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const code = coupon_code.toUpperCase();

    const { data: coupon, error } = await supabase
      .from("coupon_codes")
      .select("*, splash_reservations!coupon_codes_reservation_id_fkey(*)")
      .eq("code", code)
      .maybeSingle();

    if (error || !coupon) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid coupon code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon already used" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!coupon.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon not active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        type: coupon.type,
        tier: coupon.tier,
        discount_percent: coupon.discount_percent,
        discount_duration: coupon.discount_duration,
        message:
          coupon.type === "vairify_premium"
            ? `${coupon.discount_percent}% off Vairify Premium (${coupon.discount_duration})`
            : `${coupon.discount_percent}% off ChainPass V.A.I. (first year only)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Validate coupon error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

