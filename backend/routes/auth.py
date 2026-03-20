from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
import models
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
    oauth2_scheme
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Authenticate a user.
    """
    # Search by email OR username
    user = db.query(models.User).filter(
        (models.User.email == form_data.username) | 
        (models.User.username == form_data.username)
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        user_id_audit = user.email if user else "anonymous"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract roles via linking table
    user_roles = [ur.role.role_name for ur in user.user_roles if ur.role]
    primary_role = user_roles[0] if user_roles else "guest"

    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": primary_role},
        expires_delta=expires_delta,
    )

    # Store token in DB for tracking/expiry check
    db_token = models.UserToken(
        user_id=user.user_id,
        token=access_token,
        expiry_date=datetime.utcnow() + expires_delta,
        created_by=user.email,
        created_from=request.client.host if request.client else "unknown",
        token_expiry=datetime.utcnow() + expires_delta
    )
    db.add(db_token)
    
    # Update user audit info
    user.updated_by = user.email
    user.updated_at = datetime.utcnow()
    
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "role": primary_role,
    }


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    New users get the 'guest' role by default.
    """
    # Check if email is already registered
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with audit fields
    new_user = models.User(
        username=payload.username,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        created_by=payload.email, # Initial creation is by the user themselves
        created_from=request.client.host if request.client else "unknown"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Assign guest role (create if not exists)
    guest_role = db.query(models.Role).filter(models.Role.role_name == "guest").first()
    if not guest_role:
        guest_role = models.Role(
            role_name="guest", 
            description="Default role with minimum permissions",
            created_by="system",
            created_from="auto-provision"
        )
        db.add(guest_role)
        db.commit()
        db.refresh(guest_role)

    db.add(models.UserRole(
        user_id=new_user.user_id, 
        role_id=guest_role.role_id,
        created_by="system",
        created_from="auto-provision",
        token_expiry=datetime.utcnow() + timedelta(days=365) # Long lived system auto-provision
    ))
    db.commit()

    # Create a dynamic response so it matches the UserOut schema
    response_data = schemas.UserOut(
        user_id=new_user.user_id,
        username=new_user.username,
        email=new_user.email,
        role="guest"
    )
    return response_data


@router.post("/logout", response_model=schemas.LogoutResponse)
def logout(
    current_user: models.User = Depends(get_current_user), 
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Logout endpoint. Deactivates the token in the database.
    """
    db_token = db.query(models.UserToken).filter(models.UserToken.token == token).first()
    if db_token:
        db_token.is_active = False
        db_token.updated_by = current_user.email
        db_token.updated_at = datetime.utcnow()
        db.commit()

    return {"message": f"User '{current_user.email}' logged out successfully"}
