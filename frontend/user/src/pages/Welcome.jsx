import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import TiltCard from '../components/TiltCard';
import TypeWriter from '../components/TypeWriter';
import JwtDisplay from '../components/JwtDisplay';

function Welcome() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [token] = useState(() => localStorage.getItem('token') || '');

    useEffect(() => {
        api.get('/users/me')
            .then((res) => setUser(res.data))
            .catch(() => {
                // Try legacy endpoint if new one fails (for backward compat)
                api.get('/me')
                    .then((res) => setUser(res.data))
                    .catch(() => {
                        localStorage.removeItem('token');
                        navigate('/login');
                    });
            });
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Logout failed on server", e);
        }
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!user) {
        return (
            <div className="page-container">
                <div className="loading-screen">
                    <span className="spinner large" />
                    <p>Verifying your JWT token...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <TiltCard className="welcome-card">
                <span className="badge success">✓ Authenticated via JWT</span>
                <div className="welcome-icon">🎉</div>
                <h1 className="welcome-heading">
                    Hi, <span className="highlight">{user.username}</span>!
                </h1>
                <p className="welcome-subtitle">
                    <TypeWriter text="Welcome to the PVG Auth Dashboard" speed={40} />
                </p>

                <div className="student-info">
                    <div className="info-row">
                        <span className="info-label">🏷️ Username</span>
                        <span className="info-value">{user.username}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">📧 Email</span>
                        <span className="info-value">{user.email}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">🛡️ Role</span>
                        <span className={`badge ${user.role === 'admin' ? 'danger' : 'success'}`}>
                            {user.role || 'guest'}
                        </span>
                    </div>
                </div>

                {['admin', 'vice_principal', 'hod'].includes(user.role) && (
                    <Link to="/admin" className="btn-admin-link" style={{ 
                        display: 'block', 
                        textAlign: 'center', 
                        margin: '1rem 0', 
                        padding: '0.8rem', 
                        background: 'linear-gradient(45deg, #FF3D00, #FF9100)', 
                        color: 'white', 
                        borderRadius: '8px', 
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(255, 61, 0, 0.3)'
                    }}>
                        Go to Admin Dashboard
                    </Link>
                )}

                {token && (
                    <div className="token-display">
                        <div className="token-header">🔑 Your JWT Token</div>
                        <JwtDisplay token={token} />
                    </div>
                )}

                <button className="btn-logout" onClick={handleLogout}>
                    Logout
                </button>
            </TiltCard>
        </div>
    );
}

export default Welcome;
