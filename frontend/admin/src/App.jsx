import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import api from './api';

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Audit from './pages/Audit';
import UserProfile from './pages/UserProfile';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            setLoading(false);
            return;
        }

        api.get('/users/me')
            .then(res => {
                const role = res.data.role;
                const adminRoles = ['admin', 'vice_principal', 'hod', 'principal', 'accountant'];
                if (!adminRoles.includes(role)) {
                    localStorage.removeItem('admin_token');
                    navigate('/login');
                } else if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
                    navigate('/dashboard');
                } else {
                    setUser(res.data);
                }
            })
            .catch(() => {
                localStorage.removeItem('admin_token');
                navigate('/login');
            })
            .finally(() => setLoading(false));
    }, [navigate, allowedRoles]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!localStorage.getItem('admin_token')) return <Navigate to="/login" replace />;

    return React.cloneElement(children, { user });
};

const Layout = ({ children, user }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        api.post('/auth/logout').finally(() => {
            localStorage.removeItem('admin_token');
            navigate('/login');
        });
    };

    if (!user) return children;

    return (
        <div className="app-container">
            <aside className="sidebar">
                <Link to="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none' }}>
                    <div className="logo-icon"></div>
                    <span className="logo-text">PVG ADMIN</span>
                </Link>

                <nav className="nav-menu">
                    <span className="nav-section">GENERAL</span>
                    <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span>📊</span> Dashboard
                    </NavLink>

                    {['admin', 'vice_principal'].includes(user.role) && (
                        <>
                            <span className="nav-section">ADMINISTRATION</span>
                            <NavLink to="/users" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span>👥</span> Users
                            </NavLink>
                            <NavLink to="/roles" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span>🛡️</span> Roles & RBAC
                            </NavLink>
                        </>
                    )}

                    <span className="nav-section">SYSTEM</span>
                    <NavLink to="/audit" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span>📜</span> Audit Log
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button 
                        onClick={handleLogout} 
                        className="nav-item" 
                        style={{
                            background: 'rgba(244, 63, 94, 0.05)', 
                            border: '1px solid rgba(244, 63, 94, 0.1)', 
                            width: '100%', 
                            marginTop: 'auto', 
                            cursor: 'pointer',
                            color: 'var(--accent-tertiary)'
                        }}
                    >
                        <span>🚪</span> Logout System
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-user" onClick={() => navigate(`/users/${user.user_id}`)}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{user.username[0].toUpperCase()}</div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', lineHeight: 1.2 }}>{user.username}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{user.role.toUpperCase()}</div>
                        </div>
                    </div>
                </header>
                <div className="view-container">
                    {children}
                </div>
            </main>
        </div>
    );
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin', 'vice_principal']}>
                    <Layout><Users /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/roles" element={
                <ProtectedRoute allowedRoles={['admin', 'vice_principal']}>
                    <Layout><Roles /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/audit" element={
                <ProtectedRoute>
                    <Layout><Audit /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/users/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'vice_principal']}>
                    <Layout><UserProfile /></Layout>
                </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
