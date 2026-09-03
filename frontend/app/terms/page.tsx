import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsAndConditions() {
  return (
    <div className="container" style={{ padding: "60px 20px", maxWidth: "800px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--color-brand)", marginBottom: "30px", fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Home
      </Link>
      
      <h1 style={{ fontSize: "2.5rem", marginBottom: "30px" }}>Terms & Conditions</h1>
      
      <div className="glass-panel" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            By accessing or using PorulAxiom, you agree to be bound by these Terms and Conditions. This platform is a virtual simulation meant for educational and recreational purposes.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>2. Virtual Nature of the Platform</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            PorulAxiom is a paper-trading platform. All currency, assets, and capital on this platform are strictly virtual. They hold no real-world value and cannot be withdrawn or exchanged for real money.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>3. Account Responsibilities</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            You are responsible for maintaining the confidentiality of your account credentials. You agree not to exploit bugs, attempt unauthorized access, or manipulate the simulated market mechanisms.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>4. Administrative Actions</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            The platform administrators reserve the right to manage user access, make authorized virtual capital adjustments, and audit system logs to ensure fair play on the friends-only leaderboards.
          </p>
        </section>
      </div>
    </div>
  );
}
