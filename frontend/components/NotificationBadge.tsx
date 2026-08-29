"use client";

import React, { useEffect, useState } from "react";
import { ApiClient, LedgerEntry } from "../lib/api";
import { Bell, Info, ArrowUpRight, ArrowDownRight, X } from "lucide-react";

export function NotificationBadge() {
  const [adjustments, setAdjustments] = useState<LedgerEntry[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        const data = await ApiClient.getAdminAdjustments();
        if (data.length > 0) {
          setAdjustments(data);
        }
      } catch {}
    };
    fetchAdjustments();
  }, []);

  if (adjustments.length === 0 || dismissed) {
    return null;
  }

  const latest = adjustments[0];
  const isCredit = latest.amount >= 0;

  return (
    <div style={{
      background: isCredit ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
      border: `1px solid ${isCredit ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
      borderRadius: "var(--radius-md)",
      padding: "12px 16px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {isCredit ? <ArrowUpRight color="var(--color-up)" size={20} /> : <ArrowDownRight color="var(--color-down)" size={20} />}
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: isCredit ? "var(--color-up)" : "var(--color-down)" }}>
            Financial Notice: Virtual Capital {isCredit ? "Credited" : "Debited"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {latest.description} (<span className="mono" style={{ fontWeight: 600 }}>{isCredit ? "+" : ""}₹{latest.amount.toLocaleString()}</span>)
          </div>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
