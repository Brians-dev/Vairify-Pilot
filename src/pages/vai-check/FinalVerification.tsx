import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FaceScanner from "@/components/dateguard/FaceScanner";
import { supabase } from "@/integrations/supabase/client";

export default function FinalVerification() {
  const navigate = useNavigate();
  const { sessionId, role } = useParams();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const captureImage = () => {
    const video = document.querySelector("video");
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  const finalizeIfReady = async () => {
    const { data } = await supabase
      .from("vai_check_sessions")
      .select("provider_final_verified, client_final_verified")
      .eq("id", sessionId)
      .single();

    if (data?.provider_final_verified && data?.client_final_verified) {
      await supabase
        .from("vai_check_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId);
      navigate(`/vai-check/complete/${sessionId}`);
    } else {
      toast({ title: "Verification saved", description: "Waiting for the other party to finish." });
    }
  };

  const handleCapture = async () => {
    if (!sessionId || !role) return;
    const imageData = captureImage();
    if (!imageData) return;

    setIsScanning(false);
    setIsVerifying(true);

    try {
      const { data: faceResult, error: faceError } = await supabase.functions.invoke("verify-face-match", {
        body: { live_image: imageData },
      });

      if (faceError || !faceResult?.success) {
        toast({
          title: "Verification failed",
          description: faceResult?.failure_reason === "system_failure" ? "Service unavailable. Try again." : "Face did not match your VAI photo.",
          variant: "destructive",
        });
        setIsScanning(true);
        return;
      }

      const verificationField = role === "provider" ? "provider_final_verified" : "client_final_verified";
      const faceField = role === "provider" ? "provider_final_face_url" : "client_final_face_url";

      const { error } = await supabase
        .from("vai_check_sessions")
        .update({
          [verificationField]: true,
          [faceField]: imageData,
          status: "final_verification",
        })
        .eq("id", sessionId);

      if (error) throw error;

      await finalizeIfReady();
    } catch (error: any) {
      toast({ title: "Unable to verify", description: error.message || "Please try again", variant: "destructive" });
      setIsScanning(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center space-y-4 p-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto" />
          <h2 className="text-xl font-bold">Final verification in progress...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <main className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">📷 Final Verification</h1>
          <p className="text-white/80">One last scan to prove you’re the same person who signed the contract.</p>
        </div>

        <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden">
          <FaceScanner isActive={isScanning} onStreamReady={() => {}} />
        </div>

        <Button onClick={handleCapture} className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700">
          Capture & Verify
        </Button>
      </main>
    </div>
  );
}
