import { useNavigate } from "react-router-dom";
import { Shield, Eye, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Vairify</h1>
          <p className="text-gray-400">Your safety is our priority</p>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-500" />
            Our Privacy Promise
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Zero-Knowledge Architecture</p>
                <p className="text-sm text-gray-400">We never see your real identity. Your V.A.I. is your shield.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Anonymous by Design</p>
                <p className="text-sm text-gray-400">Verify others without revealing yourself. Safety without exposure.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">You Control Your Data</p>
                <p className="text-sm text-gray-400">Share only what you want, when you want, with who you want.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Free Safety Features</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium">VAI-CHECK</p>
                <p className="text-xs text-gray-400">Verify identity before every meetup</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium">DateGuard</p>
                <p className="text-xs text-gray-400">Real-time safety monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-400">⭐</span>
              </div>
              <div>
                <p className="font-medium">TrueRevu</p>
                <p className="text-xs text-gray-400">Verified reviews you can trust</p>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => navigate("/premium")}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg"
        >
          Continue
        </Button>

        <p className="text-center text-xs text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

