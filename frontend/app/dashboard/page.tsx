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
        <p className="mono" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading portfolio valuation...</p>
      </div>
    );
  }

  const isReturnPos = (portfolio?.return_percentage ?? 0) >= 0;
  const isPnlPos = (portfolio?.total_unrealized_pnl ?? 0) >= 0;

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* User Visible Net Worth Adjustment Notification */}
      <NotificationBadge />

      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
        {/* Net Worth Card */}
        <div className="glass-panel" style={{ padding: "16px" }}>
          <div className="flex-between">
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.03em" }}>TOTAL NET WORTH</span>
            <Wallet size={16} color="var(--color-primary)" />
          </div>
          <div className="mono" style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            ₹{portfolio?.net_worth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
            <span className={`badge ${isReturnPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.68rem" }}>
              {isReturnPos ? "+" : ""}{portfolio?.return_percentage.toFixed(2)}%
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Time-Weighted Return</span>
          </div>
        </div>

        {/* Available Cash Card */}
        <div className="glass-panel" style={{ padding: "16px" }}>
          <div className="flex-between">
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.03em" }}>AVAILABLE CASH</span>
            <span className="badge badge-up" style={{ fontSize: "0.62rem" }}>LIQUID</span>
          </div>
          <div className="mono" style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
            ₹{portfolio?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Invested Capital: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{portfolio?.invested_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Unrealized P&L Card */}
        <div className="glass-panel" style={{ padding: "16px" }}>
          <div className="flex-between">
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.03em" }}>UNREALIZED P&L</span>
            {isPnlPos ? <ArrowUpRight size={16} color="var(--color-up)" /> : <ArrowDownRight size={16} color="var(--color-down)" />}
          </div>
          <div className="mono" style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: isPnlPos ? "var(--color-up)" : "var(--color-down)" }}>
            {isPnlPos ? "+" : ""}₹{portfolio?.total_unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Holdings Valuation: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{portfolio?.current_holdings_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Holdings & Asset Allocation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
        {/* Active Holdings Table */}
        <div className="glass-panel" style={{ padding: "16px" }}>
          <div className="flex-between" style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
              <BarChart2 size={16} color="var(--color-primary)" />
              ACTIVE HOLDINGS ({portfolio?.holdings.length || 0})
            </h3>
            <Link href="/trade" className="btn btn-primary" style={{ padding: "5px 10px", fontSize: "0.78rem" }}>
              Trade Workstation →
            </Link>
          </div>

          {portfolio?.holdings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "0.85rem" }}>No active stock positions in your portfolio.</p>
              <Link href="/trade" style={{ color: "var(--color-primary)", fontSize: "0.82rem", fontWeight: 600, display: "inline-block", marginTop: "8px" }}>
                Execute your first paper trade →
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Quantity</th>
                  <th>Avg Price</th>
                  <th>LTP</th>
                  <th>Current Val</th>
                  <th style={{ textAlign: "right" }}>Unrealized P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio?.holdings.map((h) => {
                  const isPos = h.unrealized_pnl >= 0;
                  return (
                    <tr key={h.id}>
                      <td>
                        <div>
                          <Link href={`/trade?symbol=${h.symbol}`} className="mono" style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                            {h.symbol}
                          </Link>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{h.name}</div>
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

        {/* Right Column: Asset Allocation Chart & Recent Orders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {portfolio && (
            <PortfolioChart
              cashBalance={portfolio.cash_balance}
              holdings={portfolio.holdings}
              netWorth={portfolio.net_worth}
            />
          )}

          {/* Recent Orders Stream */}
          <div className="glass-panel" style={{ padding: "16px" }}>
            <h4 style={{ fontSize: "0.85rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--text-muted)" }}>
              <ShoppingBag size={14} color="var(--color-primary)" />
              RECENT ORDERS STREAM
            </h4>
            {recentOrders.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No recent orders.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex-between" style={{
                    padding: "6px 10px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                  }}>
                    <div>
                      <span className={`badge ${o.side === "BUY" ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.62rem", marginRight: "6px", padding: "0 3px" }}>
                        {o.side}
                      </span>
                      <strong className="mono">{o.quantity} {o.symbol}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="mono">₹{o.price.toFixed(2)}</span>
                      <span className="badge" style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", fontSize: "0.62rem" }}>
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
