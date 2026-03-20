"""
Admin-only API endpoints for the dashboard.
Provides stats, user management, and audit info.
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

import models
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_users: int
    total_roles: int
    active_sessions: int
    total_tokens: int

class UserDetail(BaseModel):
    user_id: int
    username: str
    email: str
    role: Optional[str] = None
    status: Optional[bool] = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RoleDetail(BaseModel):
    role_id: int
    role_name: str
    description: Optional[str] = None
    permissions: List[str] = []
    user_count: int = 0

    class Config:
        from_attributes = True

class AuditEntry(BaseModel):
    action: str
    user: str
    detail: str
    timestamp: str
    ip: Optional[str] = None


# ── Helper ───────────────────────────────────────────────────────────────────

def _require_admin(user: models.User):
    """Ensure the user has an admin-level role."""
    allowed = {"admin", "vice_principal", "hod", "principal", "accountant"}
    if user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin-level role required.",
        )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    total_users = db.query(models.User).count()
    total_roles = db.query(models.Role).count()
    active_sessions = db.query(models.UserToken).filter(
        models.UserToken.is_active == True,
        models.UserToken.expiry_date > datetime.utcnow(),
    ).count()
    total_tokens = db.query(models.UserToken).count()
    return DashboardStats(
        total_users=total_users,
        total_roles=total_roles,
        active_sessions=active_sessions,
        total_tokens=total_tokens,
    )


@router.get("/users", response_model=List[UserDetail])
def get_all_users_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    users = db.query(models.User).all()
    return [
        UserDetail(
            user_id=u.user_id,
            username=u.username,
            email=u.email,
            role=u.role,
            status=u.status,
            created_at=u.created_at if hasattr(u, 'created_at') else None,
        )
        for u in users
    ]

@router.get("/users/{user_id}", response_model=UserDetail)
def get_user_detail_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserDetail(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        role=user.role,
        status=user.status,
        created_at=user.created_at if hasattr(user, 'created_at') else None,
    )


@router.get("/roles", response_model=List[RoleDetail])
def get_all_roles_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    roles = db.query(models.Role).all()
    result = []
    for r in roles:
        count = db.query(models.UserRole).filter(models.UserRole.role_id == r.role_id).count()
        result.append(RoleDetail(
            role_id=r.role_id,
            role_name=r.role_name,
            description=r.description,
            permissions=r.permissions or [],
            user_count=count,
        ))
    return result


@router.get("/audit", response_model=List[AuditEntry])
def get_audit_log(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    # Pull last 20 token events as audit entries
    tokens = (
        db.query(models.UserToken)
        .order_by(models.UserToken.created_at.desc())
        .limit(20)
        .all()
    )
    entries = []
    for t in tokens:
        entries.append(AuditEntry(
            action="Login" if t.is_active else "Logout",
            user=t.user.email if t.user else "unknown",
            detail=f"Token {'active' if t.is_active else 'revoked'}",
            timestamp=t.created_at.strftime("%Y-%m-%d %H:%M:%S") if t.created_at else "",
            ip=t.created_from,
        ))
    return entries
