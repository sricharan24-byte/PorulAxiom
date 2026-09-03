"use client";

import React from "react";
import { Layers } from "lucide-react";

interface OrderBookDepthProps {
  symbol: string;
  orderBook: {
    bids: { price: number; quantity: number }[];
    asks: { price: number; quantity: number }[];
  } | null;
}

export function OrderBookDepth({ symbol, orderBook }: OrderBookDepthProps) {
  if (!orderBook || (!orderBook.bids.length && !orderBook.asks.length)) {
    return (
      <div className="glass-panel" style={{ padding: "14px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        Loading Order Book Depth for {symbol}...
      </div>
    );
  }

  const bids = orderBook.bids.slice(0, 5);
  const asks = orderBook.asks.slice(0, 5);

  const maxBidQty = Math.max(...bids.map((b) => b.quantity), 1);
  const maxAskQty = Math.max(...asks.map((a) => a.quantity), 1);

  const topBid = bids[0]?.price || 0;
  const topAsk = asks[0]?.price || 0;
  const spread = topAsk && topBid ? Math.max(0, topAsk - topBid) : 0;

  return (
    <div className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div className="flex-between">
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Layers size={14} color="var(--color-primary)" />
          MARKET DEPTH & SPREAD
        </span>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Spread: <strong style={{ color: "var(--text-primary)" }}>₹{spread.toFixed(2)}</strong>
        </span>
      </div>

      {/* Grid 2-Columns: Bids (Buy Orders) vs Asks (Sell Orders) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.78rem" }}>
        {/* Bids Column (Green) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.68rem", fontWeight: 700 }}>
            <span>BID (BUY)</span>
            <span>QTY</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
            {bids.map((b, idx) => {
              const depthPct = Math.min(100, (b.quantity / maxBidQty) * 100);
              return (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 6px",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${depthPct}%`,
                      background: "rgba(0, 230, 118, 0.12)",
                      zIndex: 0,
                    }}
                  />
                  <span className="mono" style={{ fontWeight: 700, color: "var(--color-up)", zIndex: 1 }}>
                    ₹{b.price.toFixed(2)}
                  </span>
                  <span className="mono" style={{ color: "var(--text-secondary)", zIndex: 1 }}>
                    {b.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asks Column (Red) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.68rem", fontWeight: 700 }}>
            <span>ASK (SELL)</span>
            <span>QTY</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
            {asks.map((a, idx) => {
              const depthPct = Math.min(100, (a.quantity / maxAskQty) * 100);
              return (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 6px",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${depthPct}%`,
                      background: "rgba(255, 59, 48, 0.12)",
                      zIndex: 0,
                    }}
                  />
                  <span className="mono" style={{ fontWeight: 700, color: "var(--color-down)", zIndex: 1 }}>
                    ₹{a.price.toFixed(2)}
                  </span>
                  <span className="mono" style={{ color: "var(--text-secondary)", zIndex: 1 }}>
                    {a.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
