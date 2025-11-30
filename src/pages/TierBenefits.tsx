import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TierBenefits() {
  const navigate = useNavigate();
  const [tier, setTier] = useState("public");

  useEffect(() => {
    const stored = sessionStorage.getItem("vairify_coupon");
    if (stored) {
      const data = JSON.parse(stored);
      setTier(data.tier || "public");
    }
  }, []);

  const tierInfo: Record<
    string,
    { name: string; emoji: string; color: string; benefits: string[] }
  > = {
    founding_council: {
      name: "Founding Council",
      emoji: "🔥",
      color: "from-yellow-500 to-orange-500",
      benefits: [
        "Vairify Premium FREE forever",
        "ChainPass V.A.I. FREE first year",
        "10% referral earnings for life",
        "Exclusive community calls with CEO",
        "Direct input on new features",
        "Governance voting power",
        "Council leadership eligibility",
        "Founding Council badge forever",
      ],
    },
    first_movers: {
      name: "First Movers",
      emoji: "⚡",
      color: "from-purple-500 to-blue-500",
      benefits: [
        "Vairify Premium FREE for 1 year",
        "ChainPass V.A.I. 50% off first year",
        "10% referral earnings for life",
        "Community calls with CEO",
        "Direct input on new features",
        "Governance voting power",
        "First Movers badge forever",
      ],
    },
    early_access: {
      name: "Early Access",
      emoji: "🚀",
      color: "from-green-500 to-teal-500",
      benefits: [
        "Vairify Premium FREE for 6 months",
        "ChainPass V.A.I. 20% off first year",
        "Community calls with CEO",
        "Direct input on new features",
        "Early Access badge forever",
      ],
    },
    public: {
      name: "Standard",
      emoji: "📋",
      color: "from-gray-500 to-gray-600",
      benefits: [
        "Vairify Core Safety FREE forever",
        "Vairify Premium $29.99/month",
        "ChainPass V.A.I. $29/year",
      ],
    },
  };

  const info = tierInfo[tier] ?? tierInfo.public;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className={`bg-gradient-to-r ${info.color} rounded-2xl p-6 text-center`}>
          <span className="text-4xl mb-2 block">{info.emoji}</span>
          <h1 className="text-2xl font-bold">{info.name}</h1>
          <p className="text-white/80">Your exclusive benefits</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6">
          <h2 className="font-semibold mb-4">What you get:</h2>
          <ul className="space-y-3">
            {info.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-200">
            <strong>Note:</strong> ChainPass V.A.I. is required for identity verification and is a separate annual payment after the first year ($29/year).
          </p>
        </div>

        <Button
          onClick={() => navigate("/profile-setup")}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 text-lg"
        >
          Complete Your Profile
        </Button>
      </div>
    </div>
  );
}

