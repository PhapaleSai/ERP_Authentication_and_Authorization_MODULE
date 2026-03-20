import React, { useState, useEffect } from 'react';
import api from '../api';

const Audit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/audit')
            .then(res => setLogs(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-secondary)' }}>Retrieving secure activity logs...</div>;

    return (
        <div>
            <header className="page-header">
                <h1 className="page-title">Digital Audit</h1>
                <p className="page-subtitle">Immutable ledger of system interactions and session telemetry.</p>
            </header>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Temporal Stamp</th>
                                <th>Subject</th>
                                <th>Operation</th>
                                <th>Telemetry Detail</th>
                                <th>Origin IP</th>
                                <th>Exp. Vector</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={i} style={{ animation: `fadeIn ${0.2 + i * 0.05}s ease-out` }}>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {log.timestamp}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'white' }}>{log.user.split('@')[0]}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{log.user}</div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            padding: '0.35rem 0.75rem', 
                                            borderRadius: 8, 
                                            background: log.action.includes('Login') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: log.action.includes('Login') ? 'var(--accent-secondary)' : 'var(--accent-tertiary)',
                                            fontSize: '0.7rem',
                                            fontWeight: 900,
                                            border: `1px solid ${log.action.includes('Login') ? 'var(--accent-secondary)' : 'var(--accent-tertiary)'}22`
                                        }}>
                                            {log.action.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.detail}</td>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {log.ip}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 700 }}>SESSION EXPR.</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date().toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Audit;
