import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        try {
            const response = await api.post('/auth/login', formData);
            const { access_token, role } = response.data;

            const adminRoles = ['admin', 'vice_principal', 'hod'];
            if (!adminRoles.includes(role)) {
                setError('Access denied. Admin permissions required.');
                return;
            }

            localStorage.setItem('admin_token', access_token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon" style={{ width: 64, height: 64, margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🛡️</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Admin Portal</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Authorized Personnel Access Only</p>
                </div>

                {error && (
                    <div style={{ padding: '0.8rem', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', borderRadius: 10, fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username or Email</label>
                        <input
                            type="text"
                            name="username"
                            className="form-input"
                            placeholder="admin"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#475569' }}>
                    Authorized personnel only. All access is logged.
                </div>
            </div>
        </div>
    );
};

export default Login;
