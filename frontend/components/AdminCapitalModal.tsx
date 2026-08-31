"use client";

import React, { useState } from "react";
import { ApiClient } from "../lib/api";
import { ShieldCheck, AlertCircle, PlusCircle, MinusCircle, X } from "lucide-react";

interface AdminCapitalModalProps {
  targetUserId: string;
  targetUsername: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminCapitalModal({ targetUserId, targetUsername, onClose, onSuccess }: AdminCapitalModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [amount, setAmount] = useState<string>("50000");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.length < 3) {
      setError("Please provide a brief justification reason.");
      return;
    }
    
    let rawAmount = Math.abs(parseFloat(amount));
    if (isNaN(rawAmount) || rawAmount === 0) {
      setError("Please enter a non-zero adjustment amount.");
      return;
    }

    // Apply negative sign for DEBIT (Deduction) and positive sign for CREDIT (Grant)
    const finalAmount = adjustmentType === "DEBIT" ? -rawAmount : rawAmount;

    setLoading(true);
    setError(null);

    try {
      await ApiClient.adjustCapital({
        target_user_id: targetUserId,
        amount: finalAmount,
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to execute capital adjustment.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = (presetAmount: number, type: "DEBIT" | "CREDIT") => {
    setAdjustmentType(type);
    setAmount(presetAmount.toString());
    if (!reason) {
      setReason(type === "DEBIT" ? "Administrative balance deduction" : "Virtual capital tournament grant");
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

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.2rem" }}>Virtual Capital Control</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target User: <strong style={{ color: "var(--text-primary)" }}>@{targetUsername}</strong></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Action Type Selector: Deduct vs Grant */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
              Action Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setAdjustmentType("DEBIT")}
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: adjustmentType === "DEBIT" ? "2px solid var(--color-down)" : "1px solid var(--border-subtle)",
                  background: adjustmentType === "DEBIT" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                  color: adjustmentType === "DEBIT" ? "var(--color-down)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <MinusCircle size={16} /> Deduct Balance (-)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("CREDIT")}
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: adjustmentType === "CREDIT" ? "2px solid var(--color-up)" : "1px solid var(--border-subtle)",
                  background: adjustmentType === "CREDIT" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  color: adjustmentType === "CREDIT" ? "var(--color-up)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <PlusCircle size={16} /> Add Balance (+)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              step="1000"
              className="input-field mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              required
            />
          </div>

          {/* Quick Amount Presets */}
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Quick Presets:
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => handleQuickPreset(10000, "DEBIT")} className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "4px 8px", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                - ₹10,000
              </button>
              <button type="button" onClick={() => handleQuickPreset(50000, "DEBIT")} className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "4px 8px", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                - ₹50,000
              </button>
              <button type="button" onClick={() => handleQuickPreset(100000, "DEBIT")} className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "4px 8px", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                - ₹1,00,000
              </button>
              <button type="button" onClick={() => handleQuickPreset(100000, "CREDIT")} className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "4px 8px", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                + ₹1,00,000
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Administrative Reason (Audited)
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={adjustmentType === "DEBIT" ? "e.g. Penalty fee or tournament balance reset" : "e.g. Grant bonus capital"}
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
            <button
              type="submit"
              disabled={loading}
              className={`btn ${adjustmentType === "DEBIT" ? "btn-danger" : "btn-primary"}`}
              style={{ flex: 1 }}
            >
              {loading ? "Processing..." : adjustmentType === "DEBIT" ? "Confirm Deduction (-)" : "Confirm Grant (+)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
