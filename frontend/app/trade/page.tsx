"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { ApiClient, Quote, Order, PortfolioSummary } from "../../lib/api";
import { StockChart } from "../../components/StockChart";
import { OrderTicket } from "../../components/OrderTicket";
import { Search, Layers } from "lucide-react";

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

  const handleCancelOrder = async (orderId: string) => {
    try {
      await ApiClient.cancelOrder(orderId);
      refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel order.");
    }
  };

  const filteredQuotes = quotes.filter(
    (q) =>
      q.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 3-Column Terminal Layout: Watchlist | Chart + Positions | Order Ticket + Depth */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 340px", gap: "16px" }}>
        {/* Left Column: Watchlist & Search */}
        <div className="glass-panel" style={{ padding: "16px", height: "calc(100vh - 140px)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "12px" }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search instruments..."
              style={{ paddingLeft: "32px", fontSize: "0.85rem" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredQuotes.map((q) => {
              const isSelected = q.symbol === selectedSymbol;
              const isPos = q.change >= 0;
              return (
                <div
                  key={q.symbol}
                  onClick={() => setSelectedSymbol(q.symbol)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    background: isSelected ? "rgba(56, 189, 248, 0.12)" : "transparent",
                    border: isSelected ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div className="flex-between">
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{q.symbol}</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      ₹{q.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex-between" style={{ marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <span style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.name}
                    </span>
                    <span className={`badge ${isPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.65rem", padding: "1px 4px" }}>
                      {isPos ? "+" : ""}{q.change_percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Interactive Chart + Position/Order Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Main Candlestick Chart */}
          <StockChart symbol={selectedSymbol} />

          {/* Bottom Tabs: Positions & Open Orders */}
          <div className="glass-panel" style={{ padding: "16px", flex: 1 }}>
            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px", marginBottom: "12px" }}>
              <button
                onClick={() => setActiveTab("positions")}
                style={{
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  color: activeTab === "positions" ? "var(--color-brand)" : "var(--text-muted)",
                  borderBottom: activeTab === "positions" ? "2px solid var(--color-brand)" : "none",
                  paddingBottom: "4px",
                }}
              >
                Positions ({portfolio?.holdings.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                style={{
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  color: activeTab === "orders" ? "var(--color-brand)" : "var(--text-muted)",
                  borderBottom: activeTab === "orders" ? "2px solid var(--color-brand)" : "none",
                  paddingBottom: "4px",
                }}
              >
                Open Orders ({pendingOrders.length})
              </button>
            </div>

            {activeTab === "positions" ? (
              portfolio?.holdings.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "12px 0" }}>No open positions.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>Avg Price</th>
                      <th>LTP</th>
                      <th>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio?.holdings.map((h) => {
                      const isPos = h.unrealized_pnl >= 0;
                      return (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 700 }}>{h.symbol}</td>
                          <td className="mono">{h.quantity}</td>
                          <td className="mono">₹{h.average_buy_price.toFixed(2)}</td>
                          <td className="mono">₹{h.current_price.toFixed(2)}</td>
                          <td>
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
              orders.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "12px 0" }}>No orders placed.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Side</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className={`badge ${o.side === "BUY" ? "badge-up" : "badge-down"}`}>{o.side}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{o.symbol}</td>
                        <td>{o.order_type}</td>
                        <td className="mono">{o.quantity}</td>
                        <td className="mono">₹{o.price.toFixed(2)}</td>
                        <td>
                          <span className="badge" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          {o.status === "PENDING" && (
                            <button
                              onClick={() => handleCancelOrder(o.id)}
                              className="btn btn-danger"
                              style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

        {/* Right Column: Order Ticket & Market Depth Orderbook */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Order Placement Ticket */}
          <OrderTicket
            quote={currentQuote}
            cashBalance={portfolio?.cash_balance || 0}
            onOrderPlaced={refreshData}
          />

          {/* Market Depth Orderbook */}
          <div className="glass-panel" style={{ padding: "16px" }}>
            <h4 style={{ fontSize: "0.95rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Layers size={16} color="var(--color-brand)" />
              Market Depth ({selectedSymbol})
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem" }}>
              {/* Bids */}
              <div>
                <div style={{ color: "var(--color-up)", fontWeight: 700, marginBottom: "4px", fontSize: "0.75rem" }}>BID (BUY)</div>
                {orderBook?.bids.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex-between mono" style={{ padding: "2px 0", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--color-up)" }}>₹{b.price.toFixed(2)}</span>
                    <span>{b.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Asks */}
              <div>
                <div style={{ color: "var(--color-down)", fontWeight: 700, marginBottom: "4px", fontSize: "0.75rem" }}>ASK (SELL)</div>
                {orderBook?.asks.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex-between mono" style={{ padding: "2px 0", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--color-down)" }}>₹{a.price.toFixed(2)}</span>
                    <span>{a.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradeTerminalPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", padding: "100px 0", color: "var(--text-muted)" }}>Loading Trading Terminal...</div>}>
      <TradeTerminalContent />
    </Suspense>
  );
}
