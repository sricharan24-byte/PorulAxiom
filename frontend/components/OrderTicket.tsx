"use client";

import React, { useState } from "react";
import { ApiClient, Quote } from "../lib/api";
import { CheckCircle2, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";

interface OrderTicketProps {
  quote: Quote | null;
  cashBalance: number;
  onOrderPlaced?: () => void;
}

export function OrderTicket({ quote, cashBalance, onOrderPlaced }: OrderTicketProps) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState<string>("10");
  const [limitPrice, setLimitPrice] = useState<string>(quote ? quote.price.toFixed(2) : "1000");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const priceToUse = orderType === "LIMIT" ? parseFloat(limitPrice) || 0 : quote?.price || 0;
  const qtyNumber = parseFloat(quantity) || 0;
  const estimatedTotal = priceToUse * qtyNumber;

  const handlePercentageSelect = (pct: number) => {
    if (!priceToUse || priceToUse <= 0) return;
    const maxAffordable = (cashBalance * pct) / priceToUse;
    setQuantity(Math.max(1, Math.floor(maxAffordable)).toString());
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    setLoading(true);
    setFeedback(null);

    try {
      const payload: any = {
        symbol: quote.symbol,
        side,
        order_type: orderType,
        quantity: qtyNumber,
      };
      if (orderType === "LIMIT") {
        payload.price = parseFloat(limitPrice);
      }

      const res = await ApiClient.placeOrder(payload);
      setFeedback({
        type: "success",
        message: `${side} order for ${res.quantity} ${res.symbol} ${res.status.toLowerCase()}!`,
      });
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to place order.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "20px" }}>
      {/* Side Toggle: BUY / SELL */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => setSide("BUY")}
          style={{
            padding: "10px",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: side === "BUY" ? "2px solid #10b981" : "1px solid var(--border-subtle)",
            background: side === "BUY" ? "rgba(16, 185, 129, 0.15)" : "transparent",
            color: side === "BUY" ? "#10b981" : "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          BUY {quote?.symbol}
        </button>
        <button
          type="button"
          onClick={() => setSide("SELL")}
          style={{
            padding: "10px",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: side === "SELL" ? "2px solid #f43f5e" : "1px solid var(--border-subtle)",
            background: side === "SELL" ? "rgba(244, 63, 94, 0.15)" : "transparent",
            color: side === "SELL" ? "#f43f5e" : "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          SELL {quote?.symbol}
        </button>
      </div>

      <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Order Type Toggle: Market vs Limit */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Order Type</label>
          <div style={{ display: "flex", background: "rgba(30, 38, 51, 0.6)", borderRadius: "var(--radius-sm)", padding: "2px" }}>
            <button
              type="button"
              onClick={() => setOrderType("MARKET")}
              style={{
                padding: "4px 10px",
                fontSize: "0.75rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: orderType === "MARKET" ? "var(--color-brand)" : "transparent",
                color: orderType === "MARKET" ? "#000" : "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setOrderType("LIMIT")}
              style={{
                padding: "4px 10px",
                fontSize: "0.75rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: orderType === "LIMIT" ? "var(--color-brand)" : "transparent",
                color: orderType === "LIMIT" ? "#000" : "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Limit Price Input if LIMIT */}
        {orderType === "LIMIT" && (
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              Limit Price (₹)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              className="input-field mono"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              required
            />
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Quantity (Shares)</label>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Avail. Cash: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{cashBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
            </span>
          </div>
          <input
            type="number"
            step="1"
            min="1"
            className="input-field mono"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        {/* Quick Percentages */}
        {side === "BUY" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {[0.25, 0.5, 0.75, 1.0].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageSelect(pct)}
                className="btn btn-outline"
                style={{ padding: "4px 0", fontSize: "0.75rem" }}
              >
                {pct * 100}%
              </button>
            ))}
          </div>
        )}

        {/* Estimated Summary */}
        <div style={{
          background: "rgba(15, 20, 28, 0.7)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "0.85rem",
        }}>
          <div className="flex-between">
            <span style={{ color: "var(--text-muted)" }}>Estimated Value</span>
            <span className="mono" style={{ fontWeight: 700 }}>₹{estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex-between">
            <span style={{ color: "var(--text-muted)" }}>Brokerage / Slippage</span>
            <span className="badge badge-up" style={{ fontSize: "0.7rem" }}>₹0.00 (PAPER)</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            background: feedback.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
            border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
            color: feedback.type === "success" ? "var(--color-up)" : "var(--color-down)",
          }}>
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Place Order Button */}
        <button
          type="submit"
          disabled={loading || !quote || qtyNumber <= 0}
          className={`btn ${side === "BUY" ? "btn-buy" : "btn-sell"}`}
          style={{ width: "100%", padding: "12px", fontSize: "1rem", marginTop: "4px" }}
        >
          <ShoppingBag size={18} />
          {loading ? "Transacting..." : `Execute ${side} Order`}
        </button>
      </form>
    </div>
  );
}
