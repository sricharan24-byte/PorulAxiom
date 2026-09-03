"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { ApiClient, Quote, Order, PortfolioSummary } from "../../lib/api";
import { StockChart } from "../../components/StockChart";
import { OrderBookDepth } from "../../components/OrderBookDepth";
import { Search, Layers, XCircle, CheckCircle2, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

function TradeTerminalContent() {
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get("symbol") || "RELIANCE";

  const { user } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbolParam);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBook, setOrderBook] = useState<{ bids: any[]; asks: any[] } | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "orders">("positions");

  // Order Ticket State
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const [allQuotes, obData, portData, ordersData] = await Promise.all([
        ApiClient.getQuotes(),
        ApiClient.getOrderBook(selectedSymbol),
        ApiClient.getPortfolioSummary(),
        ApiClient.getOrders(),
      ]);
      setQuotes(allQuotes);
      setOrderBook(obData);
      setPortfolio(portData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const currentQuote = quotes.find((q) => q.symbol === selectedSymbol) || null;

  useEffect(() => {
    if (currentQuote && orderType === "LIMIT" && !limitPrice) {
      setLimitPrice(currentQuote.price.toString());
    }
  }, [currentQuote, orderType]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await ApiClient.cancelOrder(orderId);
      refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel order.");
    }
  };

  const handleApplyCapitalPercentage = (pct: number) => {
    if (!currentQuote || !portfolio) return;
    const price = orderType === "LIMIT" ? parseFloat(limitPrice) || currentQuote.price : currentQuote.price;
    if (price <= 0) return;

    if (side === "BUY") {
      const availableCash = portfolio.cash_balance * (pct / 100);
      const maxQty = Math.floor(availableCash / price);
      setQuantity(Math.max(1, maxQty));
    } else {
      const holding = portfolio.holdings.find((h) => h.symbol === selectedSymbol);
      const maxQty = holding ? Math.floor(holding.quantity * (pct / 100)) : 0;
      setQuantity(Math.max(1, maxQty));
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuote) return;

    setIsSubmitting(true);
    setOrderFeedback(null);

    try {
      const payload: any = {
        symbol: selectedSymbol,
        side,
        order_type: orderType,
        quantity: Number(quantity),
      };

      if (orderType === "LIMIT") {
        payload.price = parseFloat(limitPrice);
      }

      await ApiClient.placeOrder(payload);
      setOrderFeedback(`Successfully submitted ${side} ${quantity} ${selectedSymbol}!`);
      refreshData();
    } catch (err: any) {
      setOrderFeedback(`Error: ${err.message || "Failed to submit order."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuotes = quotes.filter(
    (q) =>
      q.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 3-Column Workstation: Watchlist | Chart + Positions | Order Ticket + Depth */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 340px", gap: "16px" }}>
        
        {/* Left Column: Watchlist & Search */}
        <div className="glass-panel" style={{ padding: "14px", height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              className="input-field mono"
              placeholder="Search watchlist..."
              style={{ paddingLeft: "30px", fontSize: "0.8rem" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            {filteredQuotes.map((q) => {
              const isSelected = q.symbol === selectedSymbol;
              const isPos = q.change >= 0;
              return (
                <div
                  key={q.symbol}
                  onClick={() => setSelectedSymbol(q.symbol)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    background: isSelected ? "rgba(14, 165, 233, 0.12)" : "transparent",
                    border: isSelected ? "1px solid rgba(14, 165, 233, 0.3)" : "1px solid transparent",
                    transition: "all 0.12s ease",
                  }}
                >
                  <div className="flex-between">
                    <span className="mono" style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                      {q.symbol}
                    </span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                      ₹{q.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex-between" style={{ marginTop: "3px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.name}
                    </span>
                    <span className={`badge ${isPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.62rem", padding: "0 4px" }}>
                      {isPos ? "+" : ""}{q.change_percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Interactive Chart + Positions / Open Orders Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Main Candlestick & Volume Chart */}
          <StockChart symbol={selectedSymbol} />

          {/* Bottom Positions & Orders Panel */}
          <div className="glass-panel" style={{ padding: "14px", flex: 1 }}>
            <div style={{ display: "flex", gap: "14px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "10px" }}>
              <button
                onClick={() => setActiveTab("positions")}
                style={{
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  color: activeTab === "positions" ? "var(--color-primary)" : "var(--text-muted)",
                  borderBottom: activeTab === "positions" ? "2px solid var(--color-primary)" : "none",
                  paddingBottom: "4px",
                }}
              >
                Active Positions ({portfolio?.holdings.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                style={{
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  color: activeTab === "orders" ? "var(--color-primary)" : "var(--text-muted)",
                  borderBottom: activeTab === "orders" ? "2px solid var(--color-primary)" : "none",
                  paddingBottom: "4px",
                }}
              >
                Pending Orders ({pendingOrders.length})
              </button>
            </div>

            {activeTab === "positions" ? (
              portfolio?.holdings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  No open positions for {selectedSymbol}.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Quantity</th>
                      <th>Avg Price</th>
                      <th>Current Val</th>
                      <th style={{ textAlign: "right" }}>Unrealized P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio?.holdings.map((h) => {
                      const isPos = h.unrealized_pnl >= 0;
                      return (
                        <tr key={h.id}>
                          <td className="mono" style={{ fontWeight: 700 }}>{h.symbol}</td>
                          <td className="mono">{h.quantity}</td>
                          <td className="mono">₹{h.average_buy_price.toFixed(2)}</td>
                          <td className="mono">₹{h.current_value.toLocaleString()}</td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`badge ${isPos ? "badge-up" : "badge-down"}`}>
                              {isPos ? "+" : ""}₹{h.unrealized_pnl.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : (
              pendingOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  No pending limit orders.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Side</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className={`badge ${o.side === "BUY" ? "badge-up" : "badge-down"}`}>
                            {o.side}
                          </span>
                        </td>
                        <td className="mono" style={{ fontWeight: 700 }}>{o.symbol}</td>
                        <td style={{ fontSize: "0.75rem" }}>{o.order_type}</td>
                        <td className="mono">{o.quantity}</td>
                        <td className="mono">₹{(o.price || 0).toFixed(2)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleCancelOrder(o.id)}
                            className="btn btn-danger"
                            style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

        {/* Right Column: Order Execution Ticket + Order Book Depth */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Order Ticket */}
          <div className="glass-panel" style={{ padding: "16px" }}>
            <div className="flex-between" style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>
                ORDER EXECUTION
              </span>
              <span className="mono" style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Wallet size={13} color="var(--color-primary)" />
                Cash: <strong style={{ color: "var(--text-primary)" }}>₹{portfolio?.cash_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </span>
            </div>

            {/* Buy / Sell Side Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setSide("BUY")}
                className={`btn ${side === "BUY" ? "btn-buy" : "btn-outline"}`}
                style={{ padding: "8px", fontSize: "0.85rem" }}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide("SELL")}
                className={`btn ${side === "SELL" ? "btn-sell" : "btn-outline"}`}
                style={{ padding: "8px", fontSize: "0.85rem" }}
              >
                SELL
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Order Type Selector */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setOrderType("MARKET")}
                  style={{
                    padding: "6px",
                    borderRadius: "var(--radius-sm)",
                    border: orderType === "MARKET" ? "1px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                    background: orderType === "MARKET" ? "rgba(14, 165, 233, 0.1)" : "transparent",
                    color: orderType === "MARKET" ? "var(--color-primary)" : "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  MARKET
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("LIMIT")}
                  style={{
                    padding: "6px",
                    borderRadius: "var(--radius-sm)",
                    border: orderType === "LIMIT" ? "1px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                    background: orderType === "LIMIT" ? "rgba(14, 165, 233, 0.1)" : "transparent",
                    color: orderType === "LIMIT" ? "var(--color-primary)" : "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  LIMIT
                </button>
              </div>

              {/* Quantity Field */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Quantity (Shares)
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field mono"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
              </div>

              {/* Quick Percentage Capital Ladder Buttons */}
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Quick Allocation:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyCapitalPercentage(pct)}
                      className="btn btn-outline mono"
                      style={{ padding: "4px", fontSize: "0.7rem", textAlign: "center" }}
                    >
                      {pct === 100 ? "MAX" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limit Price Field if LIMIT order */}
              {orderType === "LIMIT" && (
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Limit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    className="input-field mono"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="e.g. 2950.00"
                    required
                  />
                </div>
              )}

              {/* Total Estimated Value */}
              <div style={{ padding: "8px", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex-between" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span>Est Total Order Value:</span>
                  <span className="mono" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    ₹{((orderType === "LIMIT" ? parseFloat(limitPrice) || 0 : currentQuote?.price || 0) * quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {orderFeedback && (
                <div style={{
                  fontSize: "0.78rem",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: orderFeedback.startsWith("Error") ? "rgba(255, 59, 48, 0.15)" : "rgba(0, 230, 118, 0.15)",
                  color: orderFeedback.startsWith("Error") ? "var(--color-down)" : "var(--color-up)",
                  border: orderFeedback.startsWith("Error") ? "1px solid var(--color-down-border)" : "1px solid var(--color-up-border)",
                }}>
                  {orderFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !currentQuote}
                className={`btn ${side === "BUY" ? "btn-buy" : "btn-sell"}`}
                style={{ padding: "10px", marginTop: "4px", fontSize: "0.88rem" }}
              >
                {isSubmitting ? "Submitting..." : `${side} ${quantity} ${selectedSymbol}`}
              </button>
            </form>
          </div>

          {/* Order Book Depth Component */}
          <OrderBookDepth symbol={selectedSymbol} orderBook={orderBook} />
        </div>
      </div>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "40px", textAlign: "center" }}>Loading Trade Terminal...</div>}>
      <TradeTerminalContent />
    </Suspense>
  );
}
