"""Friendship and Leaderboard Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class FriendRequestCreate(BaseModel):
    username: str


class FriendOut(BaseModel):
    friendship_id: str
    user_id: str
    username: str
    email: str
    status: str
    created_at: datetime


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    # STRICT RULE: Ranked by return percentage, NEVER net worth
    return_percentage: float
    total_trades: int
    is_current_user: bool = False
