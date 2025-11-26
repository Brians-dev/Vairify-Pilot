import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OtherUserProfile {
  name: string;
  vaiNumber: string;
  rating: number;
  reviewsCount: number;
  location: string;
  memberSince: string;
  bio: string;
  verified: boolean;
}

interface ReviewPreview {
  id: string;
  reviewer_vai_number: string | null;
  overall_rating: number | null;
  notes: string | null;
  submitted_at: string | null;
}

export default function MutualProfileView() {
  const navigate = useNavigate();
  const { sessionId, role } = useParams();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<OtherUserProfile | null>(null);
  const [recentReviews, setRecentReviews] = useState<ReviewPreview[]>([]);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  const pollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPolling = () => {
    if (pollTimeout.current) {
      clearTimeout(pollTimeout.current);
      pollTimeout.current = null;
    }
  };

  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        toast({ title: "Invalid session", variant: "destructive" });
        navigate("/vai-check");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication required", description: "Please log in to continue", variant: "destructive" });
        navigate("/login");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from("vai_check_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast({ title: "Session not found", variant: "destructive" });
        navigate("/vai-check");
        return;
      }

      setSession(sessionData);

      const otherUserId = role === "provider" ? sessionData.client_id : sessionData.provider_id;
      if (!otherUserId) {
        setWaitingMessage("Waiting for the other participant to join the session...");
        setOtherUser(null);
        return;
      }

      setWaitingMessage(null);

      const [{ data: profile }, { data: vaiVerification }, { data: allReviews }, { data: reviewPreviews }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, location, created_at, provider_profiles(username, bio)")
            .eq("id", otherUserId)
            .single(),
          supabase.from("vai_verifications").select("vai_number").eq("user_id", otherUserId).single(),
          supabase.from("reviews").select("overall_rating").eq("reviewed_user_id", otherUserId).eq("submitted", true),
          supabase
            .from("reviews")
            .select("id, reviewer_vai_number, overall_rating, notes, submitted_at")
            .eq("reviewed_user_id", otherUserId)
            .eq("submitted", true)
            .order("submitted_at", { ascending: false })
            .limit(3),
        ]);

      const reviewCount = allReviews?.length || 0;
      const avgRating =
        reviewCount > 0
          ? parseFloat(
              (
                allReviews!.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / reviewCount
              ).toFixed(1)
            )
          : 0;

      setOtherUser({
        name: profile?.provider_profiles?.username || profile?.full_name || "Unknown",
        vaiNumber: vaiVerification?.vai_number || "N/A",
        rating: avgRating,
        reviewsCount: reviewCount,
        location: profile?.location || "Location not set",
        memberSince: profile
          ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "",
        bio: profile?.provider_profiles?.bio || "No bio available",
        verified: Boolean(vaiVerification),
      });

      setRecentReviews(reviewPreviews || []);
    };

    loadSessionData();
    return () => clearPolling();
  }, [sessionId, role, navigate, toast]);

  const pollForDecision = () => {
    clearPolling();
    pollTimeout.current = setTimeout(async () => {
      const { data: sessionData } = await supabase
        .from("vai_check_sessions")
        .select("provider_decision, client_decision")
        .eq("id", sessionId)
        .single();

      if (!sessionData) return;
      const otherDecision = role === "provider" ? sessionData.client_decision : sessionData.provider_decision;

      if (otherDecision === "accept") {
        clearPolling();
        navigate(`/vai-check/contract/${sessionId}/${role}`);
      } else if (otherDecision === "decline") {
        clearPolling();
        navigate(`/vai-check/declined/${sessionId}`);
      } else {
        pollForDecision();
      }
    }, 3000);
  };

  const handleDecision = async (decision: "accept" | "decline") => {
    if (!sessionId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Authentication required", variant: "destructive" });
      navigate("/login");
      return;
    }

    const updateField = role === "provider" ? "provider_decision" : "client_decision";
    const { error } = await supabase
      .from("vai_check_sessions")
      .update({
        [updateField]: decision,
        status: decision === "decline" ? "declined" : session?.status || "profiles_viewed",
      })
      .eq("id", sessionId);

    if (error) {
      toast({ title: "Unable to save decision", variant: "destructive" });
      return;
    }

    if (decision === "decline") {
      navigate(`/vai-check/declined/${sessionId}`);
      return;
    }

    const { data: sessionData } = await supabase
      .from("vai_check_sessions")
      .select("provider_decision, client_decision")
      .eq("id", sessionId)
      .single();

    const otherDecision = role === "provider" ? sessionData?.client_decision : sessionData?.provider_decision;
    if (otherDecision === "accept") {
      await supabase.from("vai_check_sessions").update({ status: "contract_review" }).eq("id", sessionId);
      navigate(`/vai-check/contract/${sessionId}/${role}`);
      return;
    }

    if (otherDecision === "decline") {
      navigate(`/vai-check/declined/${sessionId}`);
      return;
    }

    setWaitingMessage("Thanks! Waiting for the other participant to respond...");
    pollForDecision();
  };

  if (waitingMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] flex items-center justify-center text-center text-white px-6">
        <div className="space-y-4">
          <div className="text-4xl">⏳</div>
          <p className="text-lg font-semibold">{waitingMessage}</p>
          <p className="text-sm text-white/70">
            Keep this screen open. We’ll move you forward as soon as both decisions are recorded.
          </p>
          <Button variant="ghost" className="text-white/80" onClick={() => navigate("/vai-check")}>
            Cancel session
          </Button>
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] flex items-center justify-center text-white">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white pb-24">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-gradient-to-b from-[#0A1628] to-transparent z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vai-check")} className="text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm">V.A.I.-CHECK</span>
        <div className="w-10" />
      </header>

      <main className="px-4 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-wide text-white/60">You’re reviewing</p>
          <div className="w-24 h-24 mx-auto rounded-full bg-white/10 flex items-center justify-center text-4xl">
            👤
          </div>
          <h1 className="text-2xl font-bold">
            {otherUser.name} {otherUser.verified && "✅"}
          </h1>
          <p className="text-white/70 text-sm">V.A.I. #{otherUser.vaiNumber}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-white/80">
            <div className="flex">
              {[...Array(5)].map((_, idx) => (
                <Star key={idx} className={`w-4 h-4 ${idx < Math.round(otherUser.rating) ? "fill-yellow-400 text-yellow-400" : "text-white/30"}`} />
              ))}
            </div>
            <span>
              {otherUser.rating.toFixed(1)} • {otherUser.reviewsCount} reviews
            </span>
          </div>
          <p className="text-sm text-white/60">
            📍 {otherUser.location} • Member since {otherUser.memberSince}
          </p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-white/60 uppercase tracking-wide">About</p>
            <p className="text-white/80 text-sm">{otherUser.bio}</p>
          </CardContent>
        </Card>

        <div>
          <p className="text-xs text-white/60 uppercase tracking-wide mb-3">Recent TrueRevu feedback</p>
          {recentReviews.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-sm text-white/70">No reviews yet</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <Card key={review.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{review.overall_rating?.toFixed(1) ?? "—"}</span>
                      </div>
                      <span className="text-white/60 text-xs">
                        {review.submitted_at ? new Date(review.submitted_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      by {review.reviewer_vai_number ? `VAI ${review.reviewer_vai_number}` : "Verified member"}
                    </p>
                    {review.notes && <p className="text-sm text-white/80">“{review.notes}”</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-sm text-white/80">
          Review carefully. Once both of you accept, you’ll lock in this session, sign the mutual consent contract, and proceed to final verification.
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleDecision("accept")}
            className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Accept meeting
          </Button>
          <Button variant="ghost" onClick={() => handleDecision("decline")} className="w-full text-red-400 hover:text-red-300">
            Decline
          </Button>
        </div>
      </main>
    </div>
  );
}
