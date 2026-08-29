"use client";

import React from "react";
import { Holding } from "../lib/api";
import { PieChart, TrendingUp } from "lucide-react";

interface PortfolioChartProps {
  cashBalance: number;
  holdings: Holding[];
  netWorth: number;
}

export function PortfolioChart({ cashBalance, holdings, netWorth }: PortfolioChartProps) {
  const cashPct = netWorth > 0 ? (cashBalance / netWorth) * 100 : 100;
  const holdingsVal = netWorth - cashBalance;

  // Colors for top holdings
  const colors = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b", "#ec4899", "#a855f7"];

  return (
    <div className="glass-panel" style={{ padding: "20px" }}>
      <div className="flex-between" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <PieChart size={18} color="var(--color-brand)" />
          Asset Allocation
        </h3>
        <span className="mono" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Total Net Worth: <strong style={{ color: "var(--text-primary)" }}>₹{netWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
        </span>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div style={{
        height: "14px",
        borderRadius: "8px",
        background: "rgba(30, 38, 51, 0.8)",
        display: "flex",
        overflow: "hidden",
        marginBottom: "16px",
      }}>
        {/* Cash Segment */}
        <div
          title={`Cash: ${cashPct.toFixed(1)}%`}
          style={{
            width: `${cashPct}%`,
            background: "#10b981",
            transition: "width 0.3s ease",
          }}
        />
        {/* Holding Segments */}
        {holdings.map((h, i) => {
          const pct = netWorth > 0 ? (h.current_value / netWorth) * 100 : 0;
          return (
            <div
              key={h.id}
              title={`${h.symbol}: ${pct.toFixed(1)}%`}
              style={{
                width: `${pct}%`,
                background: colors[i % colors.length],
                transition: "width 0.3s ease",
              }}
            />
          );
        })}
      </div>

      {/* Allocation Legend */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
          <div>
            <div style={{ fontWeight: 600 }}>Cash</div>
            <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              {cashPct.toFixed(1)}% (₹{cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })})
            </div>
          </div>
        </div>

        {holdings.map((h, i) => {
          const pct = netWorth > 0 ? (h.current_value / netWorth) * 100 : 0;
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[i % colors.length] }} />
              <div>
                <div style={{ fontWeight: 600 }}>{h.symbol}</div>
                <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  {pct.toFixed(1)}% (₹{h.current_value.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
