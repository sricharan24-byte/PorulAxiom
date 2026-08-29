"use client";

import React, { useEffect, useState } from "react";
import { ApiClient, LedgerEntry } from "../../lib/api";
import { FileText, ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle } from "lucide-react";

export default function ActivityPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getLedger()
      .then(setLedger)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ maxWidth: "980px" }}>
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div className="flex-between" style={{ marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={22} color="var(--color-brand)" />
              Financial Transaction Ledger
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Append-only, immutable history of all cash debits, credits, and administrative capital adjustments.
            </p>
          </div>
          <span className="badge badge-user" style={{ fontSize: "0.75rem" }}>
            IMMUTABLE AUDIT
          </span>
        </div>

        {ledger.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>No financial ledger entries found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Description</th>
                <th>Impact</th>
                <th style={{ textAlign: "right" }}>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((tx) => {
                const isCredit = tx.amount >= 0;
                return (
                  <tr key={tx.id}>
                    <td className="mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${tx.type === "ADMIN_ADJUSTMENT" ? "badge-admin" : isCredit ? "badge-up" : "badge-down"}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {tx.description}
                      {tx.is_external_flow && (
                        <span style={{ fontSize: "0.7rem", color: "var(--color-brand)", display: "block" }}>
                          [External Cash Flow - Neutralized in Return %]
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: isCredit ? "var(--color-up)" : "var(--color-down)" }}>
                        {isCredit ? "+" : ""}₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                      ₹{tx.balance_after.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
