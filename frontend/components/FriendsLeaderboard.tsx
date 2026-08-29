"use client";

import React, { useEffect, useState } from "react";
import { ApiClient, LeaderboardEntry, Friend } from "../lib/api";
import { Trophy, UserPlus, Check, X, ShieldAlert, Award } from "lucide-react";

export function FriendsLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendUsername, setFriendUsername] = useState("");
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [boardData, friendsData] = await Promise.all([
        ApiClient.getLeaderboard(),
        ApiClient.getFriends(),
      ]);
      setLeaderboard(boardData);
      setFriends(friendsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsername) return;
    try {
      await ApiClient.sendFriendRequest(friendUsername);
      setMsg({ text: `Friend request sent to @${friendUsername}!` });
      setFriendUsername("");
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message || "Could not send friend request.", isError: true });
    }
  };

  const handleAccept = async (fId: string) => {
    try {
      await ApiClient.acceptFriend(fId);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (fId: string) => {
    try {
      await ApiClient.rejectFriend(fId);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pendingIncoming = friends.filter((f) => f.status === "PENDING");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Rule Notification Banner */}
      <div style={{
        background: "rgba(56, 189, 248, 0.08)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "0.85rem",
        color: "var(--text-secondary)",
      }}>
        <Award size={18} color="var(--color-brand)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Fair Social Competition:</strong> Leaderboard ranks users strictly by <strong>Percentage Return</strong> (neutralized from any admin capital adjustments or grants).
        </span>
      </div>

      {/* Friends Leaderboard Card */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Trophy size={20} color="var(--color-gold)" />
            Friends Return Leaderboard
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {leaderboard.length} Ranked {leaderboard.length === 1 ? "Trader" : "Traders"}
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>Rank</th>
              <th>Trader</th>
              <th>Total Trades</th>
              <th style={{ textAlign: "right" }}>Return %</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => {
              const isPos = entry.return_percentage >= 0;
              let rankBadge = `${entry.rank}`;
              if (entry.rank === 1) rankBadge = "🥇 1";
              else if (entry.rank === 2) rankBadge = "🥈 2";
              else if (entry.rank === 3) rankBadge = "🥉 3";

              return (
                <tr
                  key={entry.user_id}
                  style={{
                    background: entry.is_current_user ? "rgba(56, 189, 248, 0.08)" : "transparent",
                    fontWeight: entry.is_current_user ? 700 : 400,
                  }}
                >
                  <td className="mono" style={{ fontWeight: 700 }}>{rankBadge}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>@{entry.username}</span>
                      {entry.is_current_user && (
                        <span className="badge badge-user" style={{ fontSize: "0.65rem", padding: "1px 4px" }}>
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="mono" style={{ color: "var(--text-muted)" }}>{entry.total_trades}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`badge ${isPos ? "badge-up" : "badge-down"}`} style={{ fontSize: "0.85rem" }}>
                      {isPos ? "+" : ""}{entry.return_percentage.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Friend Request Manager */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <h4 style={{ fontSize: "1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <UserPlus size={18} color="var(--color-brand)" />
          Add Friend by Username
        </h4>
        <form onSubmit={handleSendRequest} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            className="input-field"
            placeholder="Enter username (e.g. trader_priya)"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            Send Request
          </button>
        </form>

        {msg && (
          <div style={{ marginTop: "10px", fontSize: "0.85rem", color: msg.isError ? "var(--color-down)" : "var(--color-up)" }}>
            {msg.text}
          </div>
        )}

        {/* Pending Invitations */}
        {pendingIncoming.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h5 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
              Pending Friend Requests
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pendingIncoming.map((p) => (
                <div key={p.friendship_id} className="flex-between" style={{
                  padding: "10px 14px",
                  background: "rgba(15, 20, 28, 0.7)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>@{p.username}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginLeft: "8px" }}>wants to connect</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleAccept(p.friendship_id)}
                      className="btn btn-buy"
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(p.friendship_id)}
                      className="btn btn-danger"
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
