import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FaceScanner from "@/components/dateguard/FaceScanner";

export default function ScanQRCode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [manualEntry, setManualEntry] = useState(false);
  const [sessionCodeInput, setSessionCodeInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const validateSessionForJoin = (sessionStatus: string | null) => {
    const allowedStatuses = ["qr_shown", "profiles_viewed", "contract_review", "contract_signed"];
    return sessionStatus ? allowedStatuses.includes(sessionStatus) : false;
  };

  const handleSessionJoin = async (sessionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to continue",
        variant: "destructive",
      });
      navigate("/login");
      return false;
    }

    const { data: session, error } = await supabase
      .from("vai_check_sessions")
      .select("id, status, client_id, provider_id")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      toast({ title: "Session not found", variant: "destructive" });
      return false;
    }

    if (!validateSessionForJoin(session.status)) {
      toast({
        title: "Session unavailable",
        description: "This QR code is no longer active. Ask the provider to generate a new one.",
        variant: "destructive",
      });
      return false;
    }

    if (session.client_id && session.client_id !== user.id) {
      toast({
        title: "Session already claimed",
        description: "This session already has a client connected.",
        variant: "destructive",
      });
      return false;
    }

    const updates: Record<string, unknown> = { status: "profiles_viewed" };
    if (!session.client_id) {
      updates.client_id = user.id;
    }

    const { error: updateError } = await supabase
      .from("vai_check_sessions")
      .update(updates)
      .eq("id", session.id);

    if (updateError) {
      toast({ title: "Unable to join session", variant: "destructive" });
      return false;
    }

    toast({ title: "Session joined", description: "Loading profiles..." });
    navigate(`/vai-check/mutual-view/${session.id}/client`);
    return true;
  };

  const handleScan = async (scannedData: string) => {
    try {
      setIsProcessing(true);
      const payload = JSON.parse(scannedData);
      if (!payload?.sessionId) {
        throw new Error("Invalid QR payload");
      }
      await handleSessionJoin(payload.sessionId);
    } catch (error) {
      toast({ title: "Invalid QR code", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualContinue = async () => {
    if (sessionCodeInput.length !== 8) return;
    setIsProcessing(true);

    try {
      const { data: session } = await supabase
        .from("vai_check_sessions")
        .select("id, status")
        .eq("session_code", sessionCodeInput.toUpperCase())
        .single();

      if (!session) {
        toast({ title: "Session not found", variant: "destructive" });
        return;
      }

      if (!(await handleSessionJoin(session.id))) {
        return;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto" />
          <p>Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (manualEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setManualEntry(false)} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm">Enter Session Code</span>
          <div className="w-10" />
        </header>

        <main className="px-4 py-8 max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-center">Enter 8-character session code</h1>
          <Input
            placeholder="Example: A9HT52LQ"
            value={sessionCodeInput}
            onChange={(e) => setSessionCodeInput(e.target.value.toUpperCase())}
            className="h-14 text-lg text-center font-mono bg-white/10 border-white/20 text-white placeholder:text-white/40"
            maxLength={8}
          />
          <Button
            onClick={handleManualContinue}
            disabled={sessionCodeInput.length !== 8}
            className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          >
            Join session
          </Button>
          <Button variant="ghost" className="w-full text-white/80" onClick={() => setManualEntry(false)}>
            Back to scanner
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vai-check")} className="text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm">V.A.I.-CHECK</span>
        <div className="w-10" />
      </header>

      <main className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">📷 Scan Provider's QR Code</h1>
          <p className="text-white/70 text-sm">Make sure you can trust the QR code owner before scanning.</p>
        </div>

        <div className="relative aspect-square bg-black/20 rounded-lg overflow-hidden">
          <FaceScanner isActive onStreamReady={() => {}} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-cyan-400 rounded-lg" />
          </div>
        </div>

        <p className="text-center text-white/80">Position the QR code inside the frame</p>

        <Button variant="ghost" onClick={() => setManualEntry(true)} className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-white/10">
          Enter session code manually →
        </Button>
      </main>
    </div>
  );
}
