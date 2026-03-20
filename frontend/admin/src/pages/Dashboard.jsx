import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [audit, setAudit] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.get('/admin/stats'),
            api.get('/admin/audit')
        ]).then(([sRes, aRes]) => {
            setStats(sRes.data);
            setAudit(aRes.data.slice(0, 5)); // Only show top 5
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="avatar" style={{ animation: 'pulse 2s infinite', width: 80, height: 80, fontSize: '2rem' }}>PVG</div>
        </div>
    );

    const cards = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: 'var(--accent-primary)', path: '/users' },
        { label: 'Active Sessions', value: stats?.active_sessions || 0, icon: '⚡', color: 'var(--accent-secondary)', path: '/audit' },
        { label: 'System Roles', value: stats?.total_roles || 0, icon: '🛡️', color: 'var(--warning)', path: '/roles' },
        { label: 'System Tokens', value: stats?.total_tokens || 0, icon: '📜', color: 'var(--accent-tertiary)', path: '/audit' },
    ];

    return (
        <div className="dashboard-view">
            <header className="page-header">
                <h1 className="page-title">Enterprise Dashboard</h1>
                <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>
                    System status for <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{user?.username}</span>
                </p>
            </header>

            <div className="stats-grid">
                {cards.map((card, i) => (
                    <div 
                        key={i} 
                        className="stat-card" 
                        style={{ animationDelay: `${i * 0.1}s` }}
                        onClick={() => navigate(card.path)}
                    >
                        <div className="stat-icon-wrapper" style={{ border: `1px solid ${card.color}44`, color: card.color }}>
                            {card.icon}
                        </div>
                        <div>
                            <div className="stat-label">{card.label}</div>
                            <div className="stat-value">{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
                <div className="card" onClick={() => navigate('/audit')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem' }}>Recent System Activities</h3>
                        <div className="badge badge-admin shimmer-effect" style={{ padding: '0.5rem 1rem' }}>Live Telemetry</div>
                    </div>
                    
                    <div className="table-wrapper">
                        <table style={{ borderSpacing: '0 8px', borderCollapse: 'separate' }}>
                            <thead>
                                <tr style={{ borderBottom: 'none' }}>
                                    <th style={{ padding: '0 1rem' }}>Subject</th>
                                    <th style={{ padding: '0 1rem' }}>Action</th>
                                    <th style={{ padding: '0 1rem' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {audit.map((log, i) => (
                                    <tr key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                                        <td style={{ padding: '1rem', border: 'none', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{log.user.split('@')[0]}</div>
                                        </td>
                                        <td style={{ padding: '1rem', border: 'none' }}>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                fontWeight: 800, 
                                                color: log.action.includes('Login') ? 'var(--accent-secondary)' : 'var(--accent-tertiary)' 
                                            }}>
                                                {log.action.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', border: 'none', borderRadius: '0 12px 12px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            {log.timestamp.split(' ')[1]}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>System Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Server Load</span>
                                <span style={{ fontWeight: 800 }}>{stats?.active_sessions > 10 ? 'HIGH' : 'OPTIMAL'}</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill shimmer-effect" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>DB Connectivity</span>
                                <span style={{ fontWeight: 800 }}>99.9%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill shimmer-effect" style={{ width: '99.9%', background: 'var(--accent-secondary)' }}></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Auth Cache</span>
                                <span style={{ fontWeight: 800 }}>STABLE</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill shimmer-effect" style={{ width: '32%', background: 'var(--warning)' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
