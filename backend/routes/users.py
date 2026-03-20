from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("/me", response_model=schemas.UserOut)
def get_user_me(current_user: models.User = Depends(get_current_user)):
    """
    Return the authenticated user's profile.
    """
    return current_user


@router.get("", response_model=List[schemas.UserOut])
def get_all_users(db: Session = Depends(get_db)):
    """
    Return a list of all registered users.
    """
    users = db.query(models.User).all()
    return users


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """
    Return a single user by their user_id.
    """
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return user
