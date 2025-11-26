import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  phone?: string;
  method?: 'email' | 'phone';
  resend?: boolean;
}

const normalizePhone = (value?: string): string | null => {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return value.startsWith('+') ? `+${digits}` : `+${digits}`;
};

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, method = 'email', resend: isResend }: VerificationRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = method === 'phone' ? normalizePhone(phone) : null;
    if (method === 'phone' && !normalizedPhone) {
      return new Response(
        JSON.stringify({ error: "Valid phone number with country code is required for SMS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${isResend ? 'Resending' : 'Sending'} OTP via ${method} to:`, method === 'phone' ? normalizedPhone : email);

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store OTP in database (upsert to handle resends)
    const { error: dbError } = await supabase
      .from('email_verifications')
      .upsert({
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      }, {
        onConflict: 'email'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to store OTP: ${dbError.message}`);
    }

    if (method === 'phone') {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Twilio credentials are not configured");
      }

      const smsBody = `Your Vairify verification code is ${otp}. It expires in 10 minutes.`;
      const smsPayload = new URLSearchParams({
        To: normalizedPhone!,
        From: fromNumber,
        Body: smsBody,
      });

      const authHeader = "Basic " + btoa(`${accountSid}:${authToken}`);
      const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: smsPayload.toString(),
      });

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        console.error("Twilio error:", errorText);
        throw new Error("Failed to send SMS verification code");
      }

      console.log("SMS sent successfully");
    } else {
      // Send email with OTP
      const emailResponse = await resend.emails.send({
        from: "Vairify <onboarding@resend.dev>",
        to: [email],
        subject: "Verify Your Email - Vairify",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);">
            <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px; text-align: center;">
                        <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">VAIRIFY</h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Safety Through Verification</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Verify Your Email</h2>
                        <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Welcome to Vairify! Enter this verification code to complete your registration:
                        </p>
                        
                        <!-- OTP Display -->
                        <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
                          <p style="margin: 0; font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #8B5CF6; font-family: 'Courier New', monospace;">${otp}</p>
                        </div>
                        
                        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          <strong>⏰ This code expires in 10 minutes.</strong><br>
                          If you didn't request this code, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                          Need help? Contact us at <a href="mailto:support@vairify.com" style="color: #8B5CF6; text-decoration: none;">support@vairify.com</a>
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} Vairify. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        `,
      });

      console.log("Email sent successfully:", emailResponse);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Verification code sent via ${method === 'phone' ? 'SMS' : 'email'}`,
        expiresIn: 600 // 10 minutes in seconds
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-otp function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send verification code",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
