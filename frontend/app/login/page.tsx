"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { AlertCircle, ShieldCheck, Zap } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, demoLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ username_or_email: username || email, password });
      } else {
        await register({ email, username, password });
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (type: "admin" | "trader1" | "trader2") => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(type);
      if (type === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "32px" }}>
      {/* Header Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", marginBottom: "24px" }}>
        <button
          onClick={() => { setMode("login"); setError(null); }}
          style={{
            flex: 1,
            padding: "10px",
            background: "none",
            border: "none",
            borderBottom: mode === "login" ? "2px solid var(--color-brand)" : "2px solid transparent",
            color: mode === "login" ? "var(--color-brand)" : "var(--text-muted)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode("register"); setError(null); }}
          style={{
            flex: 1,
            padding: "10px",
            background: "none",
            border: "none",
            borderBottom: mode === "register" ? "2px solid var(--color-brand)" : "2px solid transparent",
            color: mode === "register" ? "var(--color-brand)" : "var(--text-muted)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {mode === "register" && (
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
            {mode === "register" ? "Username" : "Username or Email"}
          </label>
          <input
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. trader_raj"
            required
          />
        </div>

        <div>
          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div style={{ color: "var(--color-down)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", padding: "12px", fontSize: "0.95rem", marginTop: "8px" }}
        >
          {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Register with ₹10,00,000 Paper Balance"}
        </button>
      </form>

      {/* 1-Click Fast Demo Logins */}
      <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", textAlign: "center", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          1-Click Demo Profiles
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <button
            onClick={() => handleDemo("trader1")}
            className="btn btn-outline"
            style={{ fontSize: "0.75rem", padding: "8px 4px", flexDirection: "column", gap: "4px" }}
          >
            <Zap size={14} color="var(--color-brand)" />
            Trader Raj
          </button>
          <button
            onClick={() => handleDemo("trader2")}
            className="btn btn-outline"
            style={{ fontSize: "0.75rem", padding: "8px 4px", flexDirection: "column", gap: "4px" }}
          >
            <Zap size={14} color="var(--color-brand)" />
            Trader Priya
          </button>
          <button
            onClick={() => handleDemo("admin")}
            className="btn btn-outline"
            style={{ fontSize: "0.75rem", padding: "8px 4px", flexDirection: "column", gap: "4px", borderColor: "rgba(245, 158, 11, 0.4)" }}
          >
            <ShieldCheck size={14} color="#fbbf24" />
            Sole Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: "460px", margin: "40px auto" }}>
      <Suspense fallback={<div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading Authentication...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
