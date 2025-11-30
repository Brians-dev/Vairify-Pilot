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

    const { full_name, email, phone, hear_about_us, role, tier_reserved } = await req.json();

    if (!full_name || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Full name, email, and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const { data: existing } = await supabase
      .from("splash_reservations")
      .select("id, tier_reserved, spot_number")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: "Email already registered",
          existing_spot: existing.spot_number,
          existing_tier: existing.tier_reserved,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tier_reserved) {
      const { data: availability } = await supabase
        .from("tier_availability")
        .select("*")
        .eq("tier", tier_reserved)
        .maybeSingle();

      if (availability && availability.remaining <= 0) {
        return new Response(
          JSON.stringify({ error: `${tier_reserved} spots are full` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: reservation, error: insertError } = await supabase
      .from("splash_reservations")
      .insert({
        full_name,
        email: normalizedEmail,
        phone,
        hear_about_us,
        role,
        tier_reserved,
      })
      .select()
      .single();

    if (insertError || !reservation) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create reservation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tierInfo: Record<
      string,
      { name: string; emoji: string; vairify_benefit: string; chainpass_benefit: string }
    > = {
      founding_council: {
        name: "Founding Council",
        emoji: "🔥",
        vairify_benefit: "Vairify Premium FREE forever",
        chainpass_benefit: "ChainPass V.A.I. FREE first year",
      },
      first_movers: {
        name: "First Movers",
        emoji: "⚡",
        vairify_benefit: "Vairify Premium FREE for 1 year",
        chainpass_benefit: "ChainPass V.A.I. 50% off first year",
      },
      early_access: {
        name: "Early Access",
        emoji: "🚀",
        vairify_benefit: "Vairify Premium FREE for 6 months",
        chainpass_benefit: "ChainPass V.A.I. 20% off first year",
      },
      public: {
        name: "Public",
        emoji: "📋",
        vairify_benefit: "Vairify Premium $29.99/month",
        chainpass_benefit: "ChainPass V.A.I. $29 first year",
      },
    };

    const tier = tierInfo[reservation.tier_reserved] ?? tierInfo.public;

    await supabase
      .from("splash_reservations")
      .update({ email_sent: false })
      .eq("id", reservation.id);

    return new Response(
      JSON.stringify({
        success: true,
        spot_number: reservation.spot_number,
        tier: reservation.tier_reserved,
        tier_name: tier.name,
        tier_emoji: tier.emoji,
        vairify_coupon: reservation.vairify_coupon_code,
        chainpass_coupon: reservation.chainpass_coupon_code,
        vairify_benefit: tier.vairify_benefit,
        chainpass_benefit: tier.chainpass_benefit,
        message: `${tier.emoji} You're #${reservation.spot_number} in ${tier.name}! Check your email for your exclusive codes.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reserve spot error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

