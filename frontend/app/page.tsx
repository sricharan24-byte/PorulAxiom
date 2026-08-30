"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/authContext";
import { ApiClient, Quote } from "../lib/api";
import { 
  TrendingUp, 
  ShieldCheck, 
  Trophy, 
  CheckCircle, 
  ArrowRight, 
  Zap,
  Activity
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    ApiClient.getQuotes().then(setQuotes).catch(() => {});
  }, []);

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "60px", paddingBottom: "60px" }}>
      {/* Hero Section */}
      <section style={{
        textAlign: "center",
        padding: "60px 20px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}>
        <div className="badge badge-user" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
          <Zap size={14} /> HIGH FIDELITY PAPER TRADING PLATFORM
        </div>

        <h1 style={{ fontSize: "3.2rem", maxWidth: "840px", lineHeight: 1.15, fontWeight: 800 }}>
          Trade Real Markets With <br />
          <span style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Auditable Virtual Precision.
          </span>
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "1.15rem", maxWidth: "680px" }}>
          Experience realistic market execution with ₹10,00,000 in virtual capital. Strict immutable financial ledgers, zero artificial price slippage, and friends-only return rankings.
        </p>

        <div style={{ display: "flex", gap: "14px", marginTop: "10px" }}>
          {user ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
              Enter Trading Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
                Start Trading Free <ArrowRight size={18} />
              </Link>
              <Link href="/login?mode=demo" className="btn btn-outline" style={{ padding: "14px 28px", fontSize: "1rem" }}>
                1-Click Demo Access
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Live Market Watch Banner */}
      <section className="glass-panel" style={{ padding: "24px" }}>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="var(--color-brand)" />
            Real-Time Market Quotes
          </h3>
          <Link href="/trade" style={{ color: "var(--color-brand)", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
            Open Terminal <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
          {quotes.slice(0, 8).map((q) => {
            const isPos = q.change >= 0;
            return (
              <Link
                key={q.symbol}
                href={`/trade?symbol=${q.symbol}`}
                style={{
                  background: "rgba(15, 20, 28, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <div className="flex-between">
                  <span style={{ fontWeight: 700 }}>{q.symbol}</span>
                  <span className={`badge ${isPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.7rem" }}>
                    {isPos ? "+" : ""}{q.change_percent}%
                  </span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {q.name}
                </div>
                <div className="mono" style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "4px" }}>
                  ₹{q.price.toFixed(2)}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <TrendingUp size={22} color="var(--color-brand)" />
          </div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Realistic Simulation</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Simulate Market and Limit orders with atomic validation against live quotes. No fake fills, no arbitrary slippage.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Trophy size={22} color="var(--color-gold)" />
          </div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Fair Return Leaderboards</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Rank strictly by percentage return. External cash injections and admin grants are mathematically neutralized to protect fair play.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <ShieldCheck size={22} color="var(--color-up)" />
          </div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Single Admin Invariant</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Authoritative security rules strictly prohibit secondary admins. Admin can never view passwords or alter user trading records.
          </p>
        </div>
      </section>
    </div>
  );
}
