import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ padding: "60px 20px", maxWidth: "800px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--color-brand)", marginBottom: "30px", fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Home
      </Link>
      
      <h1 style={{ fontSize: "2.5rem", marginBottom: "30px" }}>Privacy Policy</h1>
      
      <div className="glass-panel" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>1. Introduction</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Welcome to PorulAxiom. This Privacy Policy outlines how we collect, use, and protect your information when you use our virtual paper-trading platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>2. Data Collection</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            We collect basic account information (such as your email address via Google OAuth or standard registration) and your platform activity, which includes your virtual trading history, orders, and portfolio status.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>3. Data Usage</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Your data is used strictly to provide the simulated trading experience, maintain accurate virtual financial ledgers, and calculate leaderboards. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>4. Data Security</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            We implement strict security measures. Passwords are only stored as secure, salted, non-reversible hashes. Our single-admin invariant ensures that administrative access is strictly bounded.
          </p>
        </section>
      </div>
    </div>
  );
}
