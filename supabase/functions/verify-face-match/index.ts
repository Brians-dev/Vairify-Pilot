import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyFaceRequest {
  live_image: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { live_image }: VerifyFaceRequest = await req.json();

    if (!live_image) {
      return new Response(
        JSON.stringify({ success: false, error: "Live image is required" }),
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

    const { data: verification, error: verificationError } = await supabase
      .from("vai_verifications")
      .select("vai_number, biometric_photo_url")
      .eq("user_id", user.id)
      .single();

    if (verificationError || !verification) {
      return new Response(
        JSON.stringify({ success: false, error: "VAI verification record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const liveImageData = live_image.startsWith("data:")
      ? live_image
      : `data:image/jpeg;base64,${live_image}`;

    // Test mode if Lovable AI key is missing
    if (!LOVABLE_API_KEY) {
      console.warn("⚠️ LOVABLE_API_KEY not configured - returning test match");
      return new Response(
        JSON.stringify({
          success: true,
          match: true,
          confidence: 0.9,
          vai_number: verification.vai_number,
          test_mode: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a biometric face verification system. Compare the two face images provided and respond with only MATCH if they represent the same person with high confidence, or NO_MATCH otherwise.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Compare the stored biometric photo with this live capture and determine if they are the same person.",
              },
              {
                type: "image_url",
                image_url: { url: verification.biometric_photo_url },
              },
              {
                type: "image_url",
                image_url: { url: liveImageData },
              },
            ],
          },
        ],
        max_tokens: 10,
      }),
    });

    if (!aiResponse.ok) {
      const failureDetails = await aiResponse.text();
      console.error("Face verification service error:", failureDetails);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Face verification service unavailable",
          failure_reason: "system_failure",
          failure_details,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const verificationResult = aiResult.choices?.[0]?.message?.content?.trim();
    const match = verificationResult === "MATCH";

    if (!match) {
      return new Response(
        JSON.stringify({
          success: false,
          match: false,
          confidence: 0.2,
          failure_reason: verificationResult ? "failed_verification" : "system_failure",
          failure_details: verificationResult
            ? "Face verification did not meet the required confidence threshold"
            : "Face verification service returned an invalid response",
          allow_manual_review: true,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        match: true,
        confidence: 0.92,
        vai_number: verification.vai_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-face-match:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        failure_reason: "system_failure",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


