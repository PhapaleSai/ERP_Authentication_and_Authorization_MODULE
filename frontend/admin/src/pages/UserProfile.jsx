import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [audit, setAudit] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const [uRes, aRes] = await Promise.all([
                    api.get(`/admin/users/${id}`),
                    api.get('/admin/audit') // Filtering this for the user in frontend for now as per current schema
                ]);
                setUser(uRes.data);
                setAudit(aRes.data.filter(log => log.user === uRes.data.email));
            } catch (err) {
                console.error(err);
                if (err.response?.status === 404) navigate('/users');
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, [id, navigate]);

    if (loading) return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-secondary)' }}>Decrypting user profile...</div>;

    return (
        <div className="profile-view">
            <header className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <button 
                    onClick={() => navigate('/users')}
                    className="btn"
                    style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px', 
                        padding: '0.8rem 1.2rem',
                        color: 'white',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span style={{ fontSize: '1.1rem' }}>←</span> Back
                </button>
                <div>
                    <h1 className="page-title">{user.username}</h1>
                    <p className="page-subtitle">Detailed security profile and activity history.</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div className="avatar" style={{ width: 120, height: 120, fontSize: '3rem', margin: '0 auto 1.5rem auto' }}>
                            {user.username[0].toUpperCase()}
                        </div>
                        <span className={`badge badge-${user.role}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}>{user.role.toUpperCase()}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.5rem' }}>IDENTIFIER</div>
                            <div style={{ fontWeight: 700 }}>UID: {user.user_id}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.5rem' }}>EMAIL ADDRESS</div>
                            <div style={{ fontWeight: 700 }}>{user.email}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.5rem' }}>ACCOUNT CREATED</div>
                            <div style={{ fontWeight: 700 }}>{new Date(user.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.5rem' }}>ACCESS STATUS</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: user.status ? 'var(--success)' : 'var(--error)' }}></div>
                                <span style={{ fontWeight: 700 }}>{user.status ? 'ACTIVE / ONLINE' : 'SUSPENDED'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '2rem' }}>Security Audit Timeline</h3>
                    {audit.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {audit.map((log, i) => (
                                <div key={i} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: log.action.includes('Login') ? 'var(--success)' : 'var(--accent-tertiary)' }}>
                                            {log.action.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{log.detail}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{log.timestamp.split(' ')[0]}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp.split(' ')[1]}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.01)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
                            <p style={{ color: 'var(--text-muted)' }}>No recent audit events found for this identity.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
