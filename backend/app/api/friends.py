"""Friends and Social Return Leaderboard API routes."""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.friendship import Friendship
from app.models.trade import Trade
from app.models.user import User
from app.schemas.friends import FriendOut, FriendRequestCreate, LeaderboardEntry
from app.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/api/friends", tags=["friends"])


@router.get("", response_model=List[FriendOut])
def list_friends(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all friendships and pending requests for the user."""
    friendships = (
        db.query(Friendship)
        .filter((Friendship.requester_id == current_user.id) | (Friendship.addressee_id == current_user.id))
        .all()
    )

    result = []
    for f in friendships:
        other_user_id = f.addressee_id if f.requester_id == current_user.id else f.requester_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        if other_user:
            result.append(FriendOut(
                friendship_id=f.id,
                user_id=other_user.id,
                username=other_user.username,
                email=other_user.email,
                status=f.status,
                created_at=f.created_at,
            ))
    return result


@router.post("/request", response_model=FriendOut, status_code=status.HTTP_201_CREATED)
def send_friend_request(
    req: FriendRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Send a friend request by username."""
    target = db.query(User).filter(User.username == req.username).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{req.username}' not found.")

    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot friend yourself.")

    # Check existing friendship
    existing = db.query(Friendship).filter(
        ((Friendship.requester_id == current_user.id) & (Friendship.addressee_id == target.id))
        | ((Friendship.requester_id == target.id) & (Friendship.addressee_id == current_user.id))
    ).first()

    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Friendship request already exists.")

    new_f = Friendship(
        requester_id=current_user.id,
        addressee_id=target.id,
        status="PENDING",
    )
    db.add(new_f)
    db.commit()
    db.refresh(new_f)

    return FriendOut(
        friendship_id=new_f.id,
        user_id=target.id,
        username=target.username,
        email=target.email,
        status=new_f.status,
        created_at=new_f.created_at,
    )


@router.post("/{friendship_id}/accept", response_model=FriendOut)
def accept_friend_request(
    friendship_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Accept a pending friend request."""
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found.")

    if friendship.addressee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the recipient can accept this request.")

    friendship.status = "ACCEPTED"
    friendship.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(friendship)

    requester = db.query(User).filter(User.id == friendship.requester_id).first()
    return FriendOut(
        friendship_id=friendship.id,
        user_id=requester.id,
        username=requester.username,
        email=requester.email,
        status=friendship.status,
        created_at=friendship.created_at,
    )


@router.post("/{friendship_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_or_remove_friend(
    friendship_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Reject or remove a friendship."""
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found.")

    if friendship.requester_id != current_user.id and friendship.addressee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    db.delete(friendship)
    db.commit()


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_friends_leaderboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return friends-only leaderboard ranked by Percentage Return (Neutralized)."""
    # 1. Fetch all accepted friends
    accepted_friendships = db.query(Friendship).filter(
        ((Friendship.requester_id == current_user.id) | (Friendship.addressee_id == current_user.id))
        & (Friendship.status == "ACCEPTED")
    ).all()

    friend_user_ids = {current_user.id}
    for f in accepted_friendships:
        friend_user_ids.add(f.addressee_id if f.requester_id == current_user.id else f.requester_id)

    users_in_board = db.query(User).filter(User.id.in_(friend_user_ids)).all()

    # 2. Calculate percentage return for each
    entries = []
    for u in users_in_board:
        ret_pct = portfolio_service.get_user_return_percentage(db, u)
        t_count = db.query(Trade).filter(Trade.user_id == u.id).count()
        entries.append({
            "user_id": u.id,
            "username": u.username,
            "return_percentage": ret_pct,
            "total_trades": t_count,
            "is_current_user": (u.id == current_user.id),
        })

    # 3. Sort strictly by return percentage descending
    entries.sort(key=lambda x: x["return_percentage"], reverse=True)

    # 4. Assign rank numbers
    ranked_result = []
    for idx, e in enumerate(entries, start=1):
        ranked_result.append(LeaderboardEntry(
            rank=idx,
            user_id=e["user_id"],
            username=e["username"],
            return_percentage=e["return_percentage"],
            total_trades=e["total_trades"],
            is_current_user=e["is_current_user"],
        ))

    return ranked_result
