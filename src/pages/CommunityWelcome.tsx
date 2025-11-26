import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function CommunityWelcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const ensureAuthenticated = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      }
    };
    ensureAuthenticated();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#04020A] via-[#0B1A2E] to-[#030711] flex items-center justify-center px-4">
      <Card className="max-w-xl w-full bg-white/5 border-white/10 text-white shadow-2xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-semibold">Congratulations!</CardTitle>
          <CardDescription className="text-base text-white/80">
            You&apos;re in the most advanced safety-first companion community. Complete your profile so
            clients and trusted providers know who you are.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3 text-white/80 text-sm">
            <li>• Create a unique public username</li>
            <li>• Tell the community who you are with a short bio</li>
            <li>• Add a profile photo (optional but recommended)</li>
          </ul>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/profile-setup")}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

