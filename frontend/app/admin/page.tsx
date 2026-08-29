"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/authContext";
import { ApiClient, AdminUserView, AuditLog, PortfolioSummary } from "../../lib/api";
import { AdminCapitalModal } from "../../components/AdminCapitalModal";
import { 
  ShieldCheck, 
  Users, 
  KeyRound, 
  DollarSign, 
  FileText, 
  Activity, 
  Eye, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from "lucide-react";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUserForInspect, setSelectedUserForInspect] = useState<{ id: string; username: string } | null>(null);
  const [inspectedPortfolio, setInspectedPortfolio] = useState<PortfolioSummary | null>(null);
  const [capitalModalUser, setCapitalModalUser] = useState<{ id: string; username: string } | null>(null);
  const [resetPassUser, setResetPassUser] = useState<{ id: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, logsData] = await Promise.all([
        ApiClient.getAdminUsers(),
        ApiClient.getAuditLogs(),
      ]);
      setUsers(usersData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
      return;
    }
    if (user?.role === "ADMIN") {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await ApiClient.setAdminUserStatus(userId, !currentActive);
      setFeedback(`Updated status for user.`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const handleInspect = async (u: AdminUserView) => {
    setSelectedUserForInspect({ id: u.id, username: u.username });
    try {
      const port = await ApiClient.inspectUserPortfolio(u.id);
      setInspectedPortfolio(port);
    } catch (err: any) {
      alert(err.message || "Failed to inspect portfolio.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !newPassword) return;
    try {
      await ApiClient.resetAdminUserPassword(resetPassUser.id, newPassword);
      setFeedback(`Password reset successfully for @${resetPassUser.username}`);
      setResetPassUser(null);
      setNewPassword("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to reset password.");
    }
  };

  if (authLoading || (loading && users.length === 0)) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "100px 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading Admin Command Center...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: "4px solid #fbbf24" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.4rem" }}>Admin Command Center</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Authenticated as the single platform administrator (<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>@{user?.username}</span>).
            </p>
          </div>
        </div>
        <div className="badge badge-admin" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
          IMMUTABLE GOVERNANCE
        </div>
      </div>

      {feedback && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--color-up)", fontSize: "0.85rem" }}>
          {feedback}
        </div>
      )}

      {/* User Management Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={18} color="var(--color-brand)" />
            Registered Platform Users ({users.length})
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Non-negotiable rule: Admin cannot place, edit, or cancel user orders.
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Cash Balance</th>
              <th>Positions</th>
              <th>Orders / Trades</th>
              <th style={{ textAlign: "right" }}>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div>
                    <span style={{ fontWeight: 700 }}>@{u.username}</span>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${u.role === "ADMIN" ? "badge-admin" : "badge-user"}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? "badge-up" : "badge-down"}`}>
                    {u.is_active ? "ACTIVE" : "SUSPENDED"}
                  </span>
                </td>
                <td className="mono">₹{u.cash_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="mono">{u.holdings_count}</td>
                <td className="mono">{u.orders_count} / {u.trades_count}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    {/* Read-only inspect */}
                    <button
                      onClick={() => handleInspect(u)}
                      className="btn btn-outline"
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      title="Inspect Portfolio"
                    >
                      <Eye size={13} /> View
                    </button>

                    {/* Capital adjust */}
                    {u.role !== "ADMIN" && (
                      <button
                        onClick={() => setCapitalModalUser({ id: u.id, username: u.username })}
                        className="btn btn-outline"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        title="Adjust Capital"
                      >
                        <DollarSign size={13} /> Adjust
                      </button>
                    )}

                    {/* Reset Password */}
                    <button
                      onClick={() => setResetPassUser({ id: u.id, username: u.username })}
                      className="btn btn-outline"
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      title="Reset Password"
                    >
                      <KeyRound size={13} /> Reset Pass
                    </button>

                    {/* Toggle Active/Suspended */}
                    {u.role !== "ADMIN" && (
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className={`btn ${u.is_active ? "btn-danger" : "btn-buy"}`}
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      >
                        {u.is_active ? "Suspend" : "Activate"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Portfolio Inspection View (if selected) */}
      {selectedUserForInspect && inspectedPortfolio && (
        <div className="glass-panel" style={{ padding: "20px", border: "1px solid var(--color-brand)" }}>
          <div className="flex-between" style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>
              Portfolio Inspection: @{selectedUserForInspect.username} (Read-Only)
            </h3>
            <button onClick={() => setSelectedUserForInspect(null)} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
              Close Inspection
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div className="glass-panel" style={{ padding: "12px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NET WORTH</span>
              <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 700 }}>₹{inspectedPortfolio.net_worth.toLocaleString()}</div>
            </div>
            <div className="glass-panel" style={{ padding: "12px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>LIQUID CASH</span>
              <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 700 }}>₹{inspectedPortfolio.cash_balance.toLocaleString()}</div>
            </div>
            <div className="glass-panel" style={{ padding: "12px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TIME-WEIGHTED RETURN %</span>
              <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{inspectedPortfolio.return_percentage.toFixed(2)}%</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Average Price</th>
                <th>Current Value</th>
                <th>Unrealized P&L</th>
              </tr>
            </thead>
            <tbody>
              {inspectedPortfolio.holdings.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 700 }}>{h.symbol}</td>
                  <td className="mono">{h.quantity}</td>
                  <td className="mono">₹{h.average_buy_price.toFixed(2)}</td>
                  <td className="mono">₹{h.current_value.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${h.unrealized_pnl >= 0 ? "badge-up" : "badge-down"}`}>
                      {h.unrealized_pnl >= 0 ? "+" : ""}₹{h.unrealized_pnl.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* System Audit Logs */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={18} color="var(--color-brand)" />
            Immutable Audit Trail ({auditLogs.length} Events)
          </h3>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((l) => (
              <tr key={l.id}>
                <td className="mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td>
                  <span className="badge badge-admin">{l.actor_username || "SYSTEM"}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{l.action}</td>
                <td>{l.target_username ? `@${l.target_username}` : "—"}</td>
                <td className="mono" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Capital Adjustment Modal */}
      {capitalModalUser && (
        <AdminCapitalModal
          targetUserId={capitalModalUser.id}
          targetUsername={capitalModalUser.username}
          onClose={() => setCapitalModalUser(null)}
          onSuccess={() => {
            setFeedback(`Adjusted virtual capital for @${capitalModalUser.username}`);
            loadData();
          }}
        />
      )}

      {/* Password Reset Modal */}
      {resetPassUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "420px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Reset User Password</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Admin sets a new replacement password for @{resetPassUser.username}. Passwords are never viewed or stored in plaintext.
            </p>
            <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setResetPassUser(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
