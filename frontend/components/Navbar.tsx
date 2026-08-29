"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/authContext";
import { ApiClient, Quote } from "../lib/api";
import { 
  TrendingUp, 
  PieChart, 
  BarChart2, 
  Users, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon,
  ChevronRight
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    // Poll top quotes every 3s
    const fetchTopQuotes = async () => {
      try {
        const data = await ApiClient.getQuotes();
        setQuotes(data.slice(0, 5));
      } catch {}
    };
    fetchTopQuotes();
    const interval = setInterval(fetchTopQuotes, 3000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: PieChart },
    { href: "/trade", label: "Trade Terminal", icon: BarChart2 },
    { href: "/friends", label: "Friends & Leaderboard", icon: Users },
    { href: "/activity", label: "Activity Ledger", icon: FileText },
  ];

  if (user?.role === "ADMIN") {
    navLinks.push({ href: "/admin", label: "Admin Command", icon: ShieldCheck });
  }

  return (
    <header style={{
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(9, 12, 16, 0.9)",
      backdropFilter: "blur(16px)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Top Live Ticker Ribbon */}
      <div style={{
        background: "rgba(15, 20, 28, 0.6)",
        borderBottom: "1px solid rgba(30, 38, 51, 0.4)",
        padding: "4px 20px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
        overflowX: "auto",
        fontSize: "0.8rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-brand)", fontWeight: 600, flexShrink: 0 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
          LIVE MARKET
        </div>
        <div style={{ display: "flex", gap: "20px", whiteSpace: "nowrap" }}>
          {quotes.map((q) => {
            const isPos = q.change >= 0;
            return (
              <div key={q.symbol} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{q.symbol}</span>
                <span className="mono" style={{ fontWeight: 500 }}>₹{q.price.toFixed(2)}</span>
                <span className={`badge ${isPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.7rem", padding: "1px 4px" }}>
                  {isPos ? "+" : ""}{q.change_percent}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #0284c7, #38bdf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(56, 189, 248, 0.4)",
          }}>
            <TrendingUp size={20} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Porul<span style={{ color: "var(--color-brand)" }}>Axiom</span></span>
            <span style={{ fontSize: "0.65rem", display: "block", color: "var(--text-muted)", marginTop: "-3px", letterSpacing: "0.08em" }}>PAPER TRADING ENGINE</span>
          </div>
        </Link>

        {/* Links (if authenticated) */}
        {user ? (
          <nav style={{ display: "flex", gap: "6px" }}>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: active ? "var(--color-brand)" : "var(--text-secondary)",
                    background: active ? "rgba(56, 189, 248, 0.08)" : "transparent",
                    border: active ? "1px solid rgba(56, 189, 248, 0.2)" : "1px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {/* User / Auth Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                background: "rgba(15, 20, 28, 0.8)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
              }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserIcon size={14} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{user.username}</div>
                  <div style={{ fontSize: "0.65rem" }}>
                    <span className={`badge ${user.role === "ADMIN" ? "badge-admin" : "badge-user"}`} style={{ padding: "0 4px", fontSize: "0.65rem" }}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-outline"
                style={{ padding: "8px 12px", fontSize: "0.8rem" }}
                title="Log Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/login" className="btn btn-outline" style={{ padding: "8px 16px" }}>
                Sign In
              </Link>
              <Link href="/login?mode=register" className="btn btn-primary" style={{ padding: "8px 16px" }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
