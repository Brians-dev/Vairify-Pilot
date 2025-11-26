import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PartyDetails {
  vaiNumber: string;
  name: string;
}

export default function ContractReview() {
  const navigate = useNavigate();
  const { sessionId, role } = useParams();
  const { toast } = useToast();
  const [isSigning, setIsSigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [provider, setProvider] = useState<PartyDetails | null>(null);
  const [client, setClient] = useState<PartyDetails | null>(null);
  const [myVai, setMyVai] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!sessionId || !role) {
          navigate("/vai-check");
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: "Authentication required", variant: "destructive" });
          navigate("/login");
          return;
        }

        const { data: sessionData, error } = await supabase
          .from("vai_check_sessions")
          .select("*, provider_id, client_id")
          .eq("id", sessionId)
          .single();

        if (error || !sessionData) {
          toast({ title: "Session not found", variant: "destructive" });
          navigate("/vai-check");
          return;
        }

        const isProvider = role === "provider";
        if ((isProvider && sessionData.provider_id !== user.id) || (!isProvider && sessionData.client_id !== user.id)) {
          toast({ title: "Unauthorized", description: "You are not part of this contract", variant: "destructive" });
          navigate("/vai-check");
          return;
        }

        const [providerVai, clientVai] = await Promise.all([
          supabase.from("vai_verifications").select("vai_number").eq("user_id", sessionData.provider_id).single(),
          supabase.from("vai_verifications").select("vai_number").eq("user_id", sessionData.client_id).single(),
        ]);

        setProvider({
          name: "Provider",
          vaiNumber: providerVai.data?.vai_number || "VAI",
        });
        setClient({
          name: "Client",
          vaiNumber: clientVai.data?.vai_number || "VAI",
        });
        setMyVai(isProvider ? providerVai.data?.vai_number || "VAI" : clientVai.data?.vai_number || "VAI");
        setSession(sessionData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, role, sessionId, toast]);

  const handleSign = async () => {
    if (!sessionId || !role) return;
    setIsSigning(true);

    try {
      const field = role === "provider" ? "contract_signed_provider" : "contract_signed_client";
      const timestamp = new Date().toISOString();
      const existingContract = (session?.contract_data as Record<string, any>) || {};
      const signatures = existingContract.signatures || {};
      const updatedContract = {
        ...existingContract,
        signatures: {
          ...signatures,
          [role]: {
            vai: myVai,
            signed_at: timestamp,
          },
        },
      };

      const { data: updatedSession, error } = await supabase
        .from("vai_check_sessions")
        .update({
          [field]: true,
          contract_data: updatedContract,
          status: role === "provider" ? session?.status : "contract_review",
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSession(updatedSession);

      if (updatedSession.contract_signed_provider && updatedSession.contract_signed_client) {
        await supabase.from("vai_check_sessions").update({ status: "contract_signed" }).eq("id", sessionId);
        toast({ title: "Contract signed", description: "Proceeding to final verification..." });
        navigate(`/vai-check/final-verification/${sessionId}/${role}`);
      } else {
        toast({ title: "Contract signed", description: "Waiting for the other party..." });
      }
    } catch (error: any) {
      toast({ title: "Unable to sign", description: error.message || "Please try again", variant: "destructive" });
    } finally {
      setIsSigning(false);
    }
  };

  if (loading || !provider || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        Loading contract...
      </div>
    );
  }

  const providerSigned = Boolean(session?.contract_signed_provider);
  const clientSigned = Boolean(session?.contract_signed_client);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white p-4">
      <header className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm font-semibold">MUTUAL CONSENT CONTRACT</span>
        <div className="w-10" />
      </header>

      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col relative" style={{ height: "calc(100vh - 200px)" }}>
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4 text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                📄 VAIRIFY MUTUAL CONSENT CONTRACT
                <Scale className="w-6 h-6 text-cyan-400" />
              </h2>
              <p className="text-white/80 text-sm">
                This agreement confirms both parties have reviewed each other’s VAI credentials, discussed boundaries, and consented to this encounter under Vairify’s safety framework.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-2">
                <p className="font-bold text-lg text-cyan-400">PROVIDER</p>
                <p className="text-sm text-white/70">VAI: {provider.vaiNumber}</p>
                <p className="text-sm text-white/70">Signature: {providerSigned ? "✅ Signed" : "— Pending"}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-2">
                <p className="font-bold text-lg text-cyan-400">CLIENT</p>
                <p className="text-sm text-white/70">VAI: {client.vaiNumber}</p>
                <p className="text-sm text-white/70">Signature: {clientSigned ? "✅ Signed" : "— Pending"}</p>
              </div>
            </div>

            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10 text-sm text-white/80">
              <h3 className="font-bold text-cyan-400">Key Terms</h3>
              <ul className="space-y-2">
                <li>✅ Both parties are verified members who have completed the VAI Check process.</li>
                <li>✅ Any compensation exchanged is for time and companionship only.</li>
                <li>✅ Either party may withdraw consent at any time, without penalty.</li>
                <li>✅ Violations of consent or contract terms may result in platform suspension.</li>
              </ul>
            </div>

            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10 text-sm text-white/80">
              <h3 className="font-bold text-cyan-400">Liability & Privacy</h3>
              <p>
                Both parties release Vairify from liability for their conduct during this encounter. You agree not to record, disclose, or publish any identifying information about the other party without consent.
              </p>
            </div>

            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10 text-sm text-white/80">
              <h3 className="font-bold text-cyan-400">DateGuard & Safety</h3>
              <p>
                If DateGuard is activated, the provider’s guardians may take action if check-ins are missed. The client consents to this safety protocol and will cooperate if contacted.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 bg-gradient-to-t from-[#0A1628] to-transparent">
          <Button
            onClick={handleSign}
            disabled={isSigning || (role === "provider" ? providerSigned : clientSigned)}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 hover:from-cyan-500 hover:via-cyan-600 hover:to-blue-600"
          >
            {isSigning ? "Signing..." : `Sign as ${role?.toUpperCase()} (VAI ${myVai})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Scale, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ContractReview() {
  const navigate = useNavigate();
  const { sessionId, role } = useParams();
  const { toast } = useToast();
  const [isSigning, setIsSigning] = useState(false);
  
  // Mock VAI numbers
  const providerVAI = '9I7T35L';
  const clientVAI = '2K8F91P';
  const myVAI = role === 'provider' ? providerVAI : clientVAI;
  const myRole = role;

  const handleSign = async () => {
    setIsSigning(true);
    const signedField = myRole === 'provider' ? 'contract_signed_provider' : 'contract_signed_client';

    const { error } = await supabase
      .from('vai_check_sessions')
      .update({
        [signedField]: true
      })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign contract",
        variant: "destructive"
      });
      setIsSigning(false);
      return;
    }

    toast({
      title: "✓ Contract Signed",
      description: "Proceeding to facial verification..."
    });
    
    setTimeout(() => {
      navigate(`/vai-check/final-verification/${sessionId}/${myRole}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white p-4">
      <header className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm font-semibold">MUTUAL CONSENT CONTRACT</span>
        <div className="w-10"></div>
      </header>

      {/* Contract Frame */}
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col relative" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Scrollable Contract Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Main Title Section */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
              <h2 className="text-xl font-bold text-center flex items-center justify-center gap-2">
                📄 VAIRIFY MUTUAL CONSENT CONTRACT
                <Scale className="w-6 h-6 text-cyan-400" />
              </h2>
              <h3 className="text-lg font-semibold text-center text-cyan-400">MUTUAL CONSENT ENCOUNTER AGREEMENT</h3>
              <p className="text-white/90 leading-relaxed text-center max-w-3xl mx-auto">
                This meeting/encounter is between two consenting adults. Any gifts, donations, or compensation exchanged are for time and companionship only, and are not payments for any specific acts. Both parties enter this agreement freely, voluntarily, and without coercion.
              </p>
            </div>

            {/* Parties Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-cyan-400 flex items-center gap-2">
                <div className="w-1 h-6 bg-cyan-400 rounded"></div>
                PARTIES TO THIS AGREEMENT
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-2">
                  <p className="font-bold text-lg text-cyan-400">PROVIDER</p>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-white/60">V.A.I. Number:</span> <span className="font-mono font-semibold">{providerVAI}</span></p>
                    <p><span className="text-white/60">Verified Status:</span> ✅ Verified on Nov 6, 2025</p>
                    <p><span className="text-white/60">V.A.I.-CHECK Enabled:</span> Yes</p>
                    <p><span className="text-white/60">DateGuard Active:</span> Yes</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-2">
                  <p className="font-bold text-lg text-cyan-400">CLIENT</p>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-white/60">V.A.I. Number:</span> <span className="font-mono font-semibold">{clientVAI}</span></p>
                    <p><span className="text-white/60">Verified Status:</span> ✅ Verified on Nov 6, 2025</p>
                    <p><span className="text-white/60">V.A.I.-CHECK Enabled:</span> Yes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">1. MUTUAL CONSENT</h3>
              <p className="text-white/80">Both parties acknowledge and agree:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We are both 18 years of age or older</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We are entering this agreement voluntarily and of our own free will</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We have the legal capacity to consent to this encounter</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> No coercion, force, fraud, or deception is involved</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Either party may withdraw consent at any time</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We will respect each other's boundaries and stated limits</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> This is a private arrangement between two adults</p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">2. ENCOUNTER DETAILS</h3>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="text-white/60">Date:</span> <span className="font-semibold">November 6, 2025</span></p>
                <p><span className="text-white/60">Time:</span> <span className="font-semibold">8:00 PM</span></p>
                <p><span className="text-white/60">Duration:</span> <span className="font-semibold">2 hours</span></p>
                <p><span className="text-white/60">Location:</span> <span className="font-semibold">Miami, FL</span></p>
              </div>
              <div className="pt-3 space-y-2 text-sm">
                <p className="text-white/80 font-semibold">Meeting Type:</p>
                <p>☑ Social companionship</p>
                <p>☐ Dinner/event attendance</p>
                <p>☐ Private time</p>
                <p>☐ Other: _______________</p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">3. COMPENSATION & GIFTS</h3>
              <p className="text-white/80 text-sm">Any monetary exchange is voluntary and represents:</p>
              <ul className="space-y-1.5 text-sm list-disc list-inside marker:text-cyan-400">
                <li>Compensation for time and companionship only</li>
                <li>A gift freely given between adults</li>
                <li>NOT payment for any illegal activity</li>
                <li>NOT contingent on any specific acts</li>
              </ul>
              <p className="text-sm pt-2"><span className="text-white/60">Agreed Amount (if applicable):</span> $_______  <span className="text-white/40 text-xs">[Optional field]</span></p>
              <p className="text-sm text-white/70 pt-2 leading-relaxed">
                Both parties acknowledge this is a time-based arrangement, and any gifts or compensation are for the Provider's time, regardless of activities that may or may not occur during the encounter.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">4. HEALTH & SAFETY</h3>
              <p className="text-white/80 text-sm">Both parties represent:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We are not aware of any communicable diseases we are required to disclose</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We will practice appropriate health and safety measures</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We are responsible for our own health decisions</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We release the other party from health-related liability (except intentional harm)</p>
              </div>
              <div className="pt-3 space-y-2 text-sm bg-cyan-400/10 rounded-lg p-4 border border-cyan-400/20">
                <p className="font-semibold text-cyan-400">If DateGuard is active:</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Provider has designated a Guardian who will monitor this encounter</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Client acknowledges Guardian has Provider's location and check-in times</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Client consents to Guardian contact if Provider does not check in</p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">5. BOUNDARIES & CONSENT</h3>
              <p className="text-sm"><span className="text-white/60">Provider's Stated Boundaries:</span> <span className="italic">[Respectful interaction required]</span></p>
              <p className="text-white/80 text-sm pt-2">Client acknowledges:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> I have read and will respect Provider's stated boundaries</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Consent can be withdrawn at any time by either party</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> "No" means no - immediately and without negotiation</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> I will not pressure, coerce, or manipulate the Provider</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Violation of consent may result in criminal charges and platform ban</p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">6. PRIVACY & CONFIDENTIALITY</h3>
              <p className="text-white/80 text-sm">Both parties agree:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We will not photograph, record, or stream this encounter without explicit consent</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We will not disclose the other party's identity to third parties</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We will not share private communications outside this platform</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> V.A.I. numbers and photos may not be shared externally</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Violation of privacy may result in legal action and platform ban</p>
              </div>
              <p className="text-sm text-white/60 pt-3 italic bg-white/5 rounded p-3">
                Exception: Either party may disclose information if required by law or in cases of genuine safety concerns.
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">7. PLATFORM TERMS</h3>
              <p className="text-white/80 text-sm">This encounter is subject to:</p>
              <div className="space-y-1.5 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Vairify Terms of Service</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Vairify Community Guidelines</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> All applicable local, state, and federal laws</p>
              </div>
              <p className="text-white/80 text-sm pt-3">Both parties acknowledge:</p>
              <ul className="space-y-1.5 text-sm list-disc list-inside marker:text-cyan-400/60">
                <li>Vairify is a platform for connecting adults only</li>
                <li>Vairify does not provide, endorse, or facilitate illegal activities</li>
                <li>Users are responsible for ensuring their activities comply with local laws</li>
                <li>Vairify is not liable for user conduct or outcomes of encounters</li>
              </ul>
            </div>

            {/* Section 8 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">8. LIABILITY WAIVER</h3>
              <p className="text-white/80 text-sm">Both parties acknowledge and agree:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We assume all risks associated with this encounter</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We release Vairify from any liability related to this encounter</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We release each other from liability except in cases of:</p>
                <div className="pl-8 space-y-1 text-white/70">
                  <p>- Intentional harm or assault</p>
                  <p>- Fraud or material misrepresentation</p>
                  <p>- Violation of consent</p>
                  <p>- Theft or property damage</p>
                </div>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> We will resolve disputes directly or through legal channels (not via platform)</p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">9. CANCELLATION POLICY</h3>
              <p className="text-sm"><span className="text-white/60">Provider's Policy:</span> <span className="font-semibold">Standard</span></p>
              <p className="text-white/80 text-sm pt-2">Standard Terms:</p>
              <ul className="space-y-1.5 text-sm list-disc list-inside marker:text-cyan-400/60">
                <li>Cancellations with 24+ hours notice: <span className="font-semibold text-green-400">No penalty</span></li>
                <li>Cancellations with 4-24 hours notice: <span className="font-semibold text-yellow-400">50% of agreed amount</span></li>
                <li>Cancellations with &lt;4 hours notice: <span className="font-semibold text-orange-400">100% of agreed amount</span></li>
                <li>No-shows: <span className="font-semibold text-red-400">100% of agreed amount + potential platform penalties</span></li>
              </ul>
              <p className="text-sm text-white/60 pt-2 italic bg-white/5 rounded p-3">
                Emergency exceptions apply (illness, family emergency, safety concerns)
              </p>
            </div>

            {/* Section 10 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">10. TRUEREVU REVIEW AGREEMENT</h3>
              <p className="text-white/80 text-sm">Both parties acknowledge:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> After this encounter, we may leave verified reviews on Vairify</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Reviews are permanent and immutable (cannot be edited or deleted)</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Reviews must be honest, respectful, and based on actual experience</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Reviews may not contain real names or identifying information</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> False or defamatory reviews may result in legal action</p>
              </div>
            </div>

            {/* Section 11 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">11. DISPUTE RESOLUTION</h3>
              <p className="text-white/80 text-sm">If a dispute arises:</p>
              <ol className="space-y-1.5 text-sm list-decimal list-inside marker:text-cyan-400 marker:font-semibold">
                <li>Parties agree to attempt good-faith resolution directly</li>
                <li>Either party may request Vairify mediation (non-binding)</li>
                <li>If unresolved, parties may pursue legal remedies</li>
                <li>This agreement is governed by <span className="font-semibold">State of Florida</span></li>
              </ol>
            </div>

            {/* Section 12 */}
            <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-bold text-lg text-cyan-400">12. LEGAL ACKNOWLEDGMENTS</h3>
              <p className="text-white/80 text-sm">Both parties certify under penalty of perjury:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> I am not a law enforcement officer or agent investigating the other party</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> I am not using this platform to facilitate human trafficking or exploitation</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> I understand this contract does not legalize prostitution where prohibited</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> I am responsible for complying with all applicable laws in my jurisdiction</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> I have read this entire agreement and understand its terms</p>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="space-y-3 bg-cyan-400/10 rounded-xl p-6 border border-cyan-400/20">
              <h3 className="font-bold text-lg text-cyan-400">AUTOMATIC EMAIL CONFIRMATION</h3>
              <p className="text-white/80 text-sm">Both parties will receive a copy of this signed contract via email:</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Sent to verified email addresses on file</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Cannot be forwarded or shared (watermarked PDF)</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> Serves as proof of mutual agreement</p>
                <p className="flex items-start gap-2"><span className="text-green-400 flex-shrink-0">✅</span> May be used as evidence in disputes</p>
              </div>
            </div>

            <div className="pb-6"></div>
          </div>
        </ScrollArea>

        {/* Scroll Indicator - positioned in the gap between content and button */}
        <div className="flex-shrink-0 py-3 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/80 to-transparent border-t border-white/5 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 animate-bounce">
            <ChevronDown className="w-6 h-6 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-semibold">Scroll to read full contract</span>
          </div>
        </div>

        {/* Fixed Bottom Signature Section */}
        <div className="flex-shrink-0 p-4 bg-gradient-to-t from-[#0A1628] to-transparent">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleSign}
              disabled={isSigning}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 hover:from-cyan-500 hover:via-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 transition-all duration-300"
            >
              {isSigning ? "Signing..." : `Sign Contract with V.A.I. ${myVAI}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
