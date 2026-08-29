"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { ApiClient, PortfolioSummary, Order } from "../../lib/api";
import { PortfolioChart } from "../../components/PortfolioChart";
import { NotificationBadge } from "../../components/NotificationBadge";
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag, 
  BarChart2, 
  ShieldCheck 
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const fetchData = async () => {
        try {
          const [portData, ordersData] = await Promise.all([
            ApiClient.getPortfolioSummary(),
            ApiClient.getOrders(),
          ]);
          setPortfolio(portData);
          setRecentOrders(ordersData.slice(0, 5));
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
      const interval = setInterval(fetchData, 4000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, router]);

  if (authLoading || (loading && !portfolio)) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "100px 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading portfolio valuation...</p>
      </div>
    );
  }

  const isReturnPos = (portfolio?.return_percentage ?? 0) >= 0;
  const isPnlPos = (portfolio?.total_unrealized_pnl ?? 0) >= 0;

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* User Visible Net Worth Adjustment Notification */}
      <NotificationBadge />

      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {/* Net Worth Card */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div className="flex-between">
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL NET WORTH</span>
            <Wallet size={18} color="var(--color-brand)" />
          </div>
          <div className="mono" style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "8px" }}>
            ₹{portfolio?.net_worth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
            <span className={`badge ${isReturnPos ? "badge-up" : "badge-down"}`}>
              {isReturnPos ? "+" : ""}{portfolio?.return_percentage.toFixed(2)}%
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Time-Weighted Return</span>
          </div>
        </div>

        {/* Available Cash Card */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div className="flex-between">
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>AVAILABLE PAPER CASH</span>
            <span className="badge badge-up" style={{ fontSize: "0.65rem" }}>LIQUID</span>
          </div>
          <div className="mono" style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "8px" }}>
            ₹{portfolio?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "6px" }}>
            Invested: <strong className="mono">₹{portfolio?.invested_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Unrealized P&L Card */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div className="flex-between">
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>UNREALIZED P&L</span>
            {isPnlPos ? <ArrowUpRight size={18} color="var(--color-up)" /> : <ArrowDownRight size={18} color="var(--color-down)" />}
          </div>
          <div className="mono" style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "8px", color: isPnlPos ? "var(--color-up)" : "var(--color-down)" }}>
            {isPnlPos ? "+" : ""}₹{portfolio?.total_unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Current Holdings Value: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{portfolio?.current_holdings_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Holdings & Allocation */}
      <div className="grid-dashboard">
        {/* Holdings Table */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div className="flex-between" style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart2 size={18} color="var(--color-brand)" />
              Active Holdings ({portfolio?.holdings.length || 0})
            </h3>
            <Link href="/trade" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
              Trade Stock
            </Link>
          </div>

          {portfolio?.holdings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <p>No active positions yet.</p>
              <Link href="/trade" style={{ color: "var(--color-brand)", fontSize: "0.9rem", fontWeight: 600, display: "inline-block", marginTop: "8px" }}>
                Place your first simulated trade →
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Quantity</th>
                  <th>Avg Buy</th>
                  <th>LTP</th>
                  <th>Current Val</th>
                  <th style={{ textAlign: "right" }}>P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio?.holdings.map((h) => {
                  const isPos = h.unrealized_pnl >= 0;
                  return (
                    <tr key={h.id}>
                      <td>
                        <div>
                          <Link href={`/trade?symbol=${h.symbol}`} style={{ fontWeight: 700, color: "var(--color-brand)" }}>
                            {h.symbol}
                          </Link>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{h.name}</div>
                        </div>
                      </td>
                      <td className="mono">{h.quantity}</td>
                      <td className="mono">₹{h.average_buy_price.toFixed(2)}</td>
                      <td className="mono">₹{h.current_price.toFixed(2)}</td>
                      <td className="mono">₹{h.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`badge ${isPos ? "badge-up" : "badge-down"}`}>
                          {isPos ? "+" : ""}₹{h.unrealized_pnl.toFixed(2)} ({isPos ? "+" : ""}{h.unrealized_pnl_percent}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: Asset Allocation & Quick Recent Orders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {portfolio && (
            <PortfolioChart
              cashBalance={portfolio.cash_balance}
              holdings={portfolio.holdings}
              netWorth={portfolio.net_worth}
            />
          )}

          {/* Recent Orders List */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShoppingBag size={16} color="var(--color-brand)" />
              Recent Orders
            </h4>
            {recentOrders.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No recent orders placed.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex-between" style={{
                    padding: "8px 12px",
                    background: "rgba(15, 20, 28, 0.6)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                  }}>
                    <div>
                      <span className={`badge ${o.side === "BUY" ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.65rem", marginRight: "6px" }}>
                        {o.side}
                      </span>
                      <strong className="mono">{o.quantity} {o.symbol}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="mono">₹{o.price.toFixed(2)}</span>
                      <span className="badge" style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", fontSize: "0.65rem" }}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
