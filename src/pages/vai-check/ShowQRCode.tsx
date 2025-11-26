import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Globe, Mail, MessageSquare, Printer, Share2, Shield, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import vairifyLogo from "@/assets/vairify-logo.png";
import { VAINumberBadge } from "@/components/vai/VAINumberBadge";

interface GalleryPhoto {
  id: string;
  url: string;
  order: number;
}

interface ProfileData {
  username: string;
  vaiNumber: string;
  avatarUrl?: string;
  publicGallery: GalleryPhoto[];
  membersGallery: GalleryPhoto[];
}

export default function ShowQRCode() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<string>("initiated");
  const [sessionCode, setSessionCode] = useState<string>("");
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [manualMessage, setManualMessage] = useState<{ variant: "warning" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate("/vai-check");
      return;
    }

    const loadData = async () => {
      try {
        const [{ data: { user } }, { data: session }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("vai_check_sessions")
            .select("id, provider_id, status, session_code, qr_data, manual_review_decision, manual_review_reason")
            .eq("id", sessionId)
            .single(),
        ]);

        if (!user) {
          toast.error("Please log in to continue");
          navigate("/login");
          return;
        }

        if (!session || session.provider_id !== user.id) {
          toast.error("You are not authorized to view this QR code");
          navigate("/vai-check");
          return;
        }

        setSessionStatus(session.status ?? "initiated");
        setSessionCode(session.session_code);
        setQrValue(session.qr_data);

        if (session.status === "manual_review_pending") {
          setManualMessage({
            variant: "warning",
            message: "Manual verification is pending. Once approved, your QR code will unlock automatically.",
          });
        } else if (session.manual_review_decision === "rejected") {
          setManualMessage({
            variant: "error",
            message:
              session.manual_review_reason === "system_failure"
                ? "Manual verification failed due to a system issue. Please capture a new photo and try again."
                : "Manual verification was rejected. Re-capture your face scan and try again.",
          });
        } else {
          setManualMessage(null);
        }

        const [{ data: profile }, { data: vai }] = await Promise.all([
          supabase
            .from("provider_profiles")
            .select("username, avatar_url, public_gallery, members_gallery")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase.from("vai_verifications").select("vai_number").eq("user_id", user.id).single(),
        ]);

        setProfileData({
          username: profile?.username || "Your Profile",
          avatarUrl: profile?.avatar_url || undefined,
          publicGallery: (profile?.public_gallery as GalleryPhoto[]) || [],
          membersGallery: (profile?.members_gallery as GalleryPhoto[]) || [],
          vaiNumber: vai?.vai_number || "VAI",
        });
      } catch (error) {
        console.error("Error loading QR data:", error);
        toast.error("Unable to load your QR code");
        navigate("/vai-check");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, sessionId]);

  if (loading || !profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading your QR code...
      </div>
    );
  }

  const qrReady = Boolean(qrValue && sessionStatus === "qr_shown");

  const handleCopySessionCode = () => {
    navigator.clipboard.writeText(sessionCode);
    toast.success("Session code copied");
  };

  const handleShareLink = (type: "email" | "sms") => {
    if (!qrValue) return;
    const linkMessage = `Join my Vairify session (code ${sessionCode}): ${window.location.origin}/vai-check/scan-qr`;
    if (type === "email") {
      window.location.href = `mailto:?subject=VAI-CHECK Invitation&body=${encodeURIComponent(linkMessage)}`;
    } else {
      window.location.href = `sms:?body=${encodeURIComponent(linkMessage)}`;
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `vai-check-${sessionCode}.png`;
    link.href = url;
    link.click();
    toast.success("QR code downloaded");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border p-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vai-check")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Share Your VAI-CHECK</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {manualMessage && (
          <Card className={manualMessage.variant === "warning" ? "bg-amber-500/10 border-amber-500/40" : "bg-red-500/10 border-red-500/40"}>
            <CardContent className="flex items-center gap-3 py-4">
              <Shield className="w-5 h-5" />
              <div>
                <p className="font-semibold">{manualMessage.variant === "warning" ? "Manual verification pending" : "Manual verification rejected"}</p>
                <p className="text-sm text-muted-foreground">{manualMessage.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{profileData.username}</CardTitle>
                <VAINumberBadge vaiNumber={profileData.vaiNumber} size="sm" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session QR Code</CardTitle>
                <CardDescription>
                  Share this with the other participant. They can also enter the session code manually if needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  {qrReady ? (
                    <QRCodeSVG
                      value={qrValue!}
                      size={256}
                      level="H"
                      includeMargin
                      imageSettings={{
                        src: vairifyLogo,
                        height: 60,
                        width: 60,
                        excavate: true,
                      }}
                    />
                  ) : (
                    <div className="px-10 py-16 text-center text-muted-foreground">
                      QR code locked until verification is approved.
                    </div>
                  )}
                </div>
                <div className="text-center text-sm text-muted-foreground space-y-1">
                  <p>Session Code</p>
                  <Button variant="outline" size="sm" onClick={handleCopySessionCode}>
                    <span className="font-mono text-base tracking-wide">{sessionCode}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share Options</CardTitle>
                <CardDescription>Send the session link or QR using your preferred method</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => handleShareLink("email")} disabled={!qrReady}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email invite
                </Button>
                <Button variant="outline" onClick={() => handleShareLink("sms")} disabled={!qrReady}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Text invite
                </Button>
                <Button variant="outline" onClick={handleDownloadQR} disabled={!qrReady}>
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
                <Button variant="outline" onClick={handlePrint} disabled={!qrReady}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print QR
                </Button>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)} className="md:col-span-2" disabled={!qrReady}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            {profileData.publicGallery.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <CardTitle>Public Gallery</CardTitle>
                    </div>
                    <Badge variant="secondary">{profileData.publicGallery.length} photos</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {profileData.publicGallery
                      .sort((a, b) => a.order - b.order)
                      .map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-muted border">
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center space-y-3">
                  <Globe className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="font-semibold">No gallery content yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add photos to your profile to make your QR landing page more engaging.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/profile/create")}>
                    Add photos
                  </Button>
                </CardContent>
              </Card>
            )}

            {profileData.membersGallery.length > 0 && (
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    <CardTitle>Members Gallery (hidden from QR scans)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Members-only images are only visible to verified members inside the app. Maintain at least a few public photos for QR viewers.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
