import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FaceScanner from "@/components/dateguard/FaceScanner";
import { supabase } from "@/integrations/supabase/client";

export default function FaceScanProvider() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);

  const captureFrame = () => {
    const video = document.querySelector("video");
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  const ensureSession = async (userId: string, faceImage: string) => {
    if (sessionId && sessionCode) {
      await supabase
        .from("vai_check_sessions")
        .update({
          provider_face_url: faceImage,
          status: "initiated",
        })
        .eq("id", sessionId);
      return { id: sessionId, session_code: sessionCode };
    }

    const { data: generatedCode, error: codeError } = await supabase.rpc("generate_session_code");
    if (codeError) throw codeError;

    const { data: session, error: sessionError } = await supabase
      .from("vai_check_sessions")
      .insert({
        provider_id: userId,
        provider_face_url: faceImage,
        session_code: generatedCode,
        status: "initiated",
        provider_decision: "pending",
        client_decision: "pending",
        verification_method: "automated",
      })
      .select("id, session_code")
      .single();

    if (sessionError || !session) {
      throw sessionError || new Error("Failed to create session");
    }

    setSessionId(session.id);
    setSessionCode(session.session_code);
    return session;
  };

  const handleCapture = async () => {
    const imageData = captureFrame();
    if (!imageData) return;

    setIsScanning(false);
    setIsVerifying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data: vaiVerification } = await supabase
        .from("vai_verifications")
        .select("vai_number, biometric_photo_url")
        .eq("user_id", user.id)
        .single();

      if (!vaiVerification) {
        toast({
          title: "V.A.I. Required",
          description: "Complete your ChainPass verification before using VAI-CHECK.",
          variant: "destructive",
        });
        navigate("/onboarding/success");
        return;
      }

      const session = await ensureSession(user.id, imageData);

      const { data: verificationResult, error: verificationError } = await supabase.functions.invoke(
        "verify-face-match",
        {
          body: { live_image: imageData },
        }
      );

      if (verificationError || !verificationResult?.success) {
        const failureReason =
          verificationResult?.failure_reason === "system_failure"
            ? "Verification service is temporarily unavailable. Please try again."
            : "We could not match your live scan to your V.A.I. photo. Check your lighting and try again.";

        toast({
          title: "Verification failed",
          description: failureReason,
          variant: "destructive",
        });

        setIsVerifying(false);
        setIsScanning(true);
        return;
      }

      const qrPayload = {
        type: "vai-check-session",
        sessionId: session.id,
        sessionCode: session.session_code,
        providerVai: vaiVerification.vai_number,
      };

      const { error: updateError } = await supabase
        .from("vai_check_sessions")
        .update({
          provider_face_verified: true,
          provider_verified: true,
          provider_face_url: imageData,
          verification_method: "automated",
          qr_data: JSON.stringify(qrPayload),
          qr_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: "qr_shown",
          metadata: {
            provider_vai: vaiVerification.vai_number,
            provider_verified_at: new Date().toISOString(),
          },
        })
        .eq("id", session.id);

      if (updateError) throw updateError;

      toast({
        title: "Identity verified",
        description: "Share your QR code with the other party to continue.",
      });

      navigate(`/vai-check/show-qr/${session.id}`);
    } catch (error: any) {
      console.error("Face verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Unable to verify your identity. Please try again.",
        variant: "destructive",
      });
      setIsScanning(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <h2 className="text-xl font-bold">Verifying your identity...</h2>
          <p className="text-white/60">Comparing against your V.A.I. biometric photo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vai-check")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm">V.A.I.-CHECK</span>
        <div className="w-10" />
      </header>

      <main className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">📷 Verify Your Identity</h1>
          <p className="text-white/80">
            We’ll match this live scan with your ChainPass biometric photo before showing your QR code.
          </p>
        </div>

        <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden">
          <FaceScanner isActive={isScanning} onStreamReady={() => {}} />
        </div>

        <div className="space-y-3 text-sm text-white/80">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
            Center your face in the frame
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
            Use bright, even lighting
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
            Remove glasses or hats if possible
          </p>
        </div>

        {sessionCode && (
          <div className="rounded-lg border border-white/10 p-3 text-center text-sm text-white/70">
            Session code reserved: <span className="font-mono text-white">{sessionCode}</span>
          </div>
        )}

        <Button
          onClick={handleCapture}
          className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
        >
          CAPTURE & VERIFY
        </Button>
      </main>
    </div>
  );
}
