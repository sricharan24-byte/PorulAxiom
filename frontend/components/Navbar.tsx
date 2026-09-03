"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/authContext";
import { ApiClient, Quote } from "../lib/api";
import { CommandPalette } from "./CommandPalette";
import { 
  TrendingUp, 
  PieChart, 
  BarChart2, 
  Users, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon,
  Search
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    // Poll top quotes every 3s
    const fetchTopQuotes = async () => {
      try {
        const data = await ApiClient.getQuotes();
        setQuotes(data.slice(0, 6));
      } catch {}
    };
    fetchTopQuotes();
    const interval = setInterval(fetchTopQuotes, 3000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: PieChart },
    { href: "/trade", label: "Trade Terminal", icon: BarChart2 },
    { href: "/friends", label: "Leaderboard", icon: Users },
    { href: "/activity", label: "Ledger", icon: FileText },
  ];

  if (user?.role === "ADMIN") {
    navLinks.push({ href: "/admin", label: "Admin Control", icon: ShieldCheck });
  }

  return (
    <>
      <header style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(8, 9, 12, 0.95)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        {/* Top Live Ticker Ribbon */}
        <div style={{
          background: "#0b0d12",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "4px 20px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          overflowX: "auto",
          fontSize: "0.78rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-primary)", fontWeight: 700, flexShrink: 0 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-up)", boxShadow: "0 0 6px var(--color-up)" }} />
            LIVE FEED
          </div>
          <div style={{ display: "flex", gap: "18px", whiteSpace: "nowrap" }}>
            {quotes.map((q) => {
              const isPos = q.change >= 0;
              return (
                <div key={q.symbol} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{q.symbol}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>₹{q.price.toFixed(2)}</span>
                  <span className={`badge ${isPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.65rem", padding: "1px 4px" }}>
                    {isPos ? "+" : ""}{q.change_percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "58px" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "4px",
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px var(--color-primary-glow)",
            }}>
              <TrendingUp size={18} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Porul<span style={{ color: "var(--color-primary)" }}>Axiom</span></span>
              <span style={{ fontSize: "0.6rem", display: "block", color: "var(--text-muted)", marginTop: "-3px", letterSpacing: "0.08em" }}>PAPER TRADING TERMINAL</span>
            </div>
          </Link>

          {/* Nav Links (if authenticated) */}
          {user ? (
            <nav style={{ display: "flex", gap: "4px" }}>
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
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      color: active ? "var(--color-primary)" : "var(--text-secondary)",
                      background: active ? "rgba(14, 165, 233, 0.1)" : "transparent",
                      border: active ? "1px solid rgba(14, 165, 233, 0.25)" : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {/* Right Section: Command Palette & User Auth */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user && (
              <button
                onClick={() => setIsCommandOpen(true)}
                className="btn btn-outline mono"
                style={{
                  padding: "5px 10px",
                  fontSize: "0.78rem",
                  gap: "8px",
                  color: "var(--text-muted)",
                  borderColor: "var(--border-subtle)",
                }}
                title="Search stocks or commands"
              >
                <Search size={14} color="var(--color-primary)" />
                <span>Search</span>
                <kbd style={{
                  padding: "1px 4px",
                  fontSize: "0.68rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "3px",
                  color: "var(--text-secondary)"
                }}>Ctrl K</kbd>
              </button>
            )}

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 10px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <UserIcon size={14} color="var(--text-secondary)" />
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>@{user.username}</span>
                    <span className={`badge ${user.role === "ADMIN" ? "badge-admin" : "badge-user"}`} style={{ marginLeft: "6px", fontSize: "0.6rem", padding: "0 4px" }}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="btn btn-outline"
                  style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                  title="Log Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <Link href="/login" className="btn btn-outline" style={{ padding: "6px 14px" }}>
                  Sign In
                </Link>
                <Link href="/login?mode=register" className="btn btn-primary" style={{ padding: "6px 14px" }}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
