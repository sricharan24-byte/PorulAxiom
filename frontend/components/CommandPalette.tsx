"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient, Quote } from "../lib/api";
import { Search, TrendingUp, BarChart2, Award, ShieldCheck, LogOut, ArrowRight, X } from "lucide-react";
import { useAuth } from "../lib/authContext";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setLoading(true);
      ApiClient.getQuotes()
        .then((res) => setQuotes(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered from Navbar or global shortcut
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredQuotes = quotes.filter(
    (q) =>
      q.symbol.toLowerCase().includes(query.toLowerCase()) ||
      q.name.toLowerCase().includes(query.toLowerCase())
  );

  const pages = [
    { name: "Paper Trading Terminal", path: "/trade", icon: TrendingUp },
    { name: "Portfolio & Net Worth", path: "/dashboard", icon: BarChart2 },
    { name: "Friends Return Ranking", path: "/leaderboard", icon: Award },
    { name: "Admin Command Center", path: "/admin", icon: ShieldCheck },
  ].filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelectPage = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleSelectStock = (symbol: string) => {
    router.push(`/trade?symbol=${symbol}`);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(4, 5, 8, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "100px",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "600px",
          overflow: "hidden",
          border: "1px solid var(--border-active)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
          <Search size={18} color="var(--color-primary)" style={{ marginRight: "12px" }} />
          <input
            type="text"
            autoFocus
            className="mono"
            placeholder="Search stock symbol (e.g. RELIANCE, NVDA, AAPL) or navigate..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: "380px", overflowY: "auto", padding: "8px" }}>
          {/* Stock Symbols Section */}
          <div style={{ padding: "6px 12px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Stock Instruments ({filteredQuotes.length})
          </div>

          {filteredQuotes.length === 0 ? (
            <div style={{ padding: "14px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              No matching instruments found.
            </div>
          ) : (
            filteredQuotes.map((q) => {
              const isPos = q.change >= 0;
              return (
                <div
                  key={q.symbol}
                  onClick={() => handleSelectStock(q.symbol)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-panel-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      {q.symbol}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{q.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      ₹{q.price.toFixed(2)}
                    </span>
                    <span className={`badge ${isPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.65rem" }}>
                      {isPos ? "+" : ""}{q.change_percent}%
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Platform Shortcuts */}
          <div style={{ padding: "12px 12px 6px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Platform Shortcuts
          </div>

          {pages.map((p) => {
            const IconComp = p.icon;
            return (
              <div
                key={p.path}
                onClick={() => handleSelectPage(p.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-panel-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconComp size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.name}</span>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div style={{ padding: "8px 16px", background: "rgba(0, 0, 0, 0.2)", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <span>Press <kbd className="mono" style={{ padding: "1px 4px", background: "var(--bg-obsidian)", borderRadius: "3px", border: "1px solid var(--border-subtle)" }}>ESC</kbd> to close</span>
          <span>PorulAxiom Terminal v1.0</span>
        </div>
      </div>
    </div>
  );
}
