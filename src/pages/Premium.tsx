import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Premium() {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [tierFromCoupon, setTierFromCoupon] = useState<string | null>(null);

  const validateCoupon = async () => {
    if (!couponCode) return;

    try {
      const response = await fetch("/functions/v1/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon_code: couponCode }),
      });
      const data = await response.json();

      if (data.valid) {
        setCouponStatus("valid");
        setTierFromCoupon(data.tier);
        sessionStorage.setItem("vairify_coupon", JSON.stringify(data));
      } else {
        setCouponStatus("invalid");
      }
    } catch {
      setCouponStatus("invalid");
    }
  };

  const features = [
    { name: "VAI-CHECK Verification", free: true, premium: true },
    { name: "DateGuard Protection", free: true, premium: true },
    { name: "TrueRevu Reviews", free: true, premium: true },
    { name: "Basic Profile", free: true, premium: true },
    { name: "VairiDate Scheduling", free: false, premium: true },
    { name: "Vairify Now", free: false, premium: true },
    { name: "Vairify Invitations", free: false, premium: true },
    { name: "Priority Support", free: false, premium: true },
    { name: "Advanced Analytics", free: false, premium: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-gray-400">Safety is always free. Premium adds convenience.</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-2">Have a coupon code?</p>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="bg-gray-700 border-gray-600"
            />
            <Button onClick={validateCoupon} variant="secondary">
              Apply
            </Button>
          </div>
          {couponStatus === "valid" && (
            <p className="text-green-400 text-sm mt-2">
              ✓ Coupon applied! {tierFromCoupon} benefits activated.
            </p>
          )}
          {couponStatus === "invalid" && (
            <p className="text-red-400 text-sm mt-2">✗ Invalid or expired coupon</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h2 className="font-bold text-lg mb-1">Free</h2>
            <p className="text-2xl font-bold mb-4">
              $0<span className="text-sm text-gray-400">/forever</span>
            </p>
            <ul className="space-y-2 text-sm">
              {features.filter((f) => f.free).map((f) => (
                <li key={f.name} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {f.name}
                </li>
              ))}
              {features
                .filter((f) => !f.free)
                .map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-gray-500">
                    <X className="w-4 h-4" />
                    {f.name}
                  </li>
                ))}
            </ul>
          </div>

          <div className="bg-gradient-to-b from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/50">
            <h2 className="font-bold text-lg mb-1">Premium</h2>
            <p className="text-2xl font-bold mb-4">
              $29.99<span className="text-sm text-gray-400">/mo</span>
            </p>
            <ul className="space-y-2 text-sm">
              {features.map((f) => (
                <li key={f.name} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          onClick={() => navigate("/tier-benefits")}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-6"
        >
          Continue with {tierFromCoupon ? tierFromCoupon.replace("_", " ").toUpperCase() : "Free"}
        </Button>
      </div>
    </div>
  );
}

