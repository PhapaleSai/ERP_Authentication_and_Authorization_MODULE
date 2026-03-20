# PVG College Auth & Enterprise Management System 🎓

A professional-grade authentication, authorization, and administrative suite built for **PVG College of Science**.

**Technology Stack:** React (Vite) · FastAPI · PostgreSQL · SQLAlchemy · Glassmorphism UI

---

## 🌟 Enhanced Enterprise Features

1. **Dual-Portal Architecture**:
   - **User Portal (`:5173`)**: Secure registration and profile management for students.
   - **Admin Portal (`:5174`)**: High-performance dashboard for institutional oversight.

2. **Enterprise Admin Dashboard**:
   - **Interactive Live Telemetry**: Real-time tracking of logins, registrations, and system events.
   - **Granular RBAC**: Manage roles and permissions with a visual policy editor.
   - **User Directory**: Deep-dive into specific user profiles with dedicated security audit timelines.
   - **System Health**: Active monitoring of server load, database connectivity, and auth caches.

3. **Robust Security & Auditing**:
   - **JWT with Session Expiry**: Every token event (login/logout) is tracked with IP and expiry data.
   - **Database-Level Auditing**: Global `AuditMixin` ensures every change is timestamped and attributed.

---

## 🚀 Unified Quick Start

Launch the entire ecosystem (Backend + User App + Admin App) with a single command:

```bash
# 1. Install root dependencies
npm install

# 2. Start all services concurrently
npm run dev
```

### Access Points:
- **Admin Dashboard**: [http://localhost:5174](http://localhost:5174) (Login: `admin` / `admin`)
- **User Portal**: [http://localhost:5173](http://localhost:5173)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📋 System Setup

### 1. Database (PostgreSQL)
Ensure PostgreSQL is running on `localhost:5432`.
1. Create database `pvg_auth`.
2. Initialize schema:
   ```bash
   psql -U postgres -d pvg_auth -f setup_auth_tables.sql
   ```

### 2. Environment Configuration
Create a `.env` in the `backend/` folder:
```env
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/pvg_auth
SECRET_KEY=pvg_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Folder Structure
- `/backend`: FastAPI core and SQLAlchemy models.
- `/frontend/user`: Vite-based student registration portal.
- `/frontend/admin`: Premium administrative dashboard.

---

## 🔐 API Reference
- **Admin**: `GET /admin/stats`, `GET /admin/users`, `GET /admin/audit`
- **Auth**: `POST /auth/login`, `POST /auth/register`, `POST /roles/assign`
- **Profiles**: `GET /users/me`, `GET /admin/users/{id}`
