"use client";

import React from "react";
import { FriendsLeaderboard } from "../../components/FriendsLeaderboard";

export default function FriendsPage() {
  return (
    <div className="container" style={{ maxWidth: "880px" }}>
      <FriendsLeaderboard />
    </div>
  );
}
