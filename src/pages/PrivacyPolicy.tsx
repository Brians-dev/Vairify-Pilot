import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: December 1, 2024</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Our Commitment to Privacy</h2>
            <p className="text-gray-300">
              Vairify is built on the principle of privacy-first design. We utilize zero-knowledge architecture to ensure your
              real identity remains protected while enabling safety verification features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-gray-300 mb-3">We collect only what's necessary for safety:</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>V.A.I. Number:</strong> Your anonymous identity code (not your real identity)</li>
              <li><strong>Biometric Hash:</strong> Encrypted facial data for verification (not stored as images)</li>
              <li><strong>Contact Info:</strong> Email/phone for account recovery and safety alerts</li>
              <li><strong>Usage Data:</strong> How you use safety features to improve the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. What We Never Collect</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Your legal name (unless required for ChainPass V.A.I.)</li>
              <li>Your home address</li>
              <li>Content of your messages</li>
              <li>Details of your encounters beyond safety verification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>VAI-CHECK: Verify identity during meetups</li>
              <li>DateGuard: Send safety alerts to your chosen guardians</li>
              <li>TrueRevu: Display anonymous reviews</li>
              <li>Account: Manage your profile and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. ChainPass Separation</h2>
            <p className="text-gray-300">
              ChainPass is a separate company that handles identity verification and V.A.I. issuance. Vairify does not have
              access to your ChainPass identity documents. We only receive your V.A.I. number and verification status.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-gray-300">
              We retain your data only as long as your account is active. You may request deletion of your data at any time
              through Settings → Privacy → Delete My Data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Access your data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data</li>
              <li>Opt out of marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
            <p className="text-gray-300">For privacy questions: privacy@vairify.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}

