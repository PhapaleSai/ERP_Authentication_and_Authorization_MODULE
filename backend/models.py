from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class AuditMixin:
    """
    Mixin to add audit fields to models.
    """
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by = Column(String(150), nullable=True)
    updated_by = Column(String(150), nullable=True)
    created_from = Column(String(100), nullable=True)
    token_expiry = Column(DateTime, nullable=True)


class Role(Base, AuditMixin):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(100), unique=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSON, nullable=True, default=list)

    # Relationship to user_roles
    user_roles = relationship("UserRole", back_populates="role")


class User(Base, AuditMixin):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(Boolean, default=True)

    # Relationship to user_roles
    user_roles = relationship("UserRole", back_populates="user")
    # Relationship to user_tokens
    tokens = relationship("UserToken", back_populates="user")

    @property
    def role(self):
        roles = [ur.role.role_name for ur in self.user_roles if ur.role]
        return roles[0] if roles else "guest"


class UserRole(Base, AuditMixin):
    __tablename__ = "user_roles"

    user_role_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    role_id = Column(Integer, ForeignKey("roles.role_id"))

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")


class UserToken(Base, AuditMixin):
    __tablename__ = "user_tokens"

    token_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    token = Column(String, unique=True, index=True, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="tokens")


# Keep the old Student model so existing root APIs don't break
class Student(Base, AuditMixin):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    student_class = Column(String(50), nullable=False)
    phone = Column(String(15), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
