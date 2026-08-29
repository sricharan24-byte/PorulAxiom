"use client";

import React, { useState } from "react";
import { ApiClient } from "../lib/api";
import { ShieldCheck, AlertCircle, CheckCircle2, X } from "lucide-react";

interface AdminCapitalModalProps {
  targetUserId: string;
  targetUsername: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminCapitalModal({ targetUserId, targetUsername, onClose, onSuccess }: AdminCapitalModalProps) {
  const [amount, setAmount] = useState<string>("50000");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.length < 5) {
      setError("Please provide a detailed justification reason (min 5 characters).");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      setError("Please enter a non-zero adjustment amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ApiClient.adjustCapital({
        target_user_id: targetUserId,
        amount: parsedAmount,
        reason,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to execute capital adjustment.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "24px", position: "relative" }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.2rem" }}>Virtual Capital Adjustment</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target User: @{targetUsername}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Adjustment Amount (₹)
            </label>
            <input
              type="number"
              step="1000"
              className="input-field mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000 (credit) or -20000 (debit)"
              required
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px", display: "block" }}>
              Positive value credits virtual cash; negative value debits.
            </span>
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Administrative Justification (Required & Audited)
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Tournament prize credit, test balance adjustment"
              required
            />
          </div>

          {error && (
            <div style={{ color: "var(--color-down)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? "Adjusting..." : "Confirm Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
