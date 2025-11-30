import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const [providerResponse, profileResponse] = await Promise.all([
          supabase
            .from("provider_profiles")
            .select("id, username, avatar_url")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("bio, avatar_url")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (providerResponse.data) {
          setProviderProfileId(providerResponse.data.id);
          setUsername(providerResponse.data.username || "");
          if (providerResponse.data.avatar_url) {
            setAvatarUrl(providerResponse.data.avatar_url);
          }
        }

        if (profileResponse.data) {
          setBio(profileResponse.data.bio || "");
          if (!providerResponse.data?.avatar_url && profileResponse.data.avatar_url) {
            setAvatarUrl(profileResponse.data.avatar_url);
          }
        }
      } catch (error) {
        console.error("Error loading profile setup:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim()) {
      setUsernameError("Username is required");
      toast({
        title: "Username required",
        description: "Pick a unique username to continue.",
        variant: "destructive",
      });
      return;
    } else {
      setUsernameError(null);
    }

    setSaving(true);
    try {
      const normalizedUsername = username.trim();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: conflict } = await supabase
        .from("provider_profiles")
        .select("id")
        .eq("username", normalizedUsername)
        .neq("user_id", user.id)
        .maybeSingle();

      if (conflict) {
        toast({
          title: "Username already taken",
          description: "Please choose a different username.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (providerProfileId) {
        const { error } = await supabase
          .from("provider_profiles")
          .update({
            username: normalizedUsername,
            bio: bio || null,
            avatar_url: avatarUrl,
          })
          .eq("id", providerProfileId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("provider_profiles")
          .insert({
            user_id: user.id,
            username: normalizedUsername,
            avatar_url: avatarUrl,
          });

        if (error) throw error;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bio: bio || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast({
        title: "Profile ready",
        description: "Welcome to the community!",
      });
      navigate("/feed");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast({
        title: "Unable to save profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Finish your profile</CardTitle>
          <CardDescription>Pick a username and introduce yourself to the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Profile photo (optional)</Label>
              <ProfilePhotoUpload
                currentPhotoUrl={avatarUrl || undefined}
                onPhotoChange={(url) => setAvatarUrl(url || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                Username <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                What should the community call you?
              </p>
              <Input
                id="username"
                placeholder="Choose a unique name..."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError && e.target.value.trim().length > 0) {
                    setUsernameError(null);
                  }
                }}
                required
                aria-invalid={!!usernameError}
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="Share a short introduction..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

