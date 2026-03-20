import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const loadData = async () => {
        try {
            const [uRes, rRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/roles')
            ]);
            setUsers(uRes.data);
            setRoles(rRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleRoleChange = async (userId, newRole) => {
        setUpdating(userId);
        try {
            await api.post('/roles/assign', { user_id: userId, role: newRole });
            await loadData();
        } catch (err) {
            alert('Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-secondary)' }}>Syncing user directory...</div>;

    return (
        <div>
            <header className="page-header">
                <h1 className="page-title">Directory Management</h1>
                <p className="page-subtitle">Provision access and manage organizational identities.</p>
            </header>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Privilege</th>
                                <th>Enrollment</th>
                                <th>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr 
                                    key={u.user_id} 
                                    style={{ animation: `fadeIn ${0.3 + i * 0.05}s ease-out`, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        if (e.target.tagName !== 'SELECT') {
                                            navigate(`/users/${u.user_id}`);
                                        }
                                    }}
                                >
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.9rem', background: i % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-tertiary)' }}>
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'white' }}>{u.username}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UID: {u.user_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.status ? 'var(--success)' : 'var(--error)', boxShadow: u.status ? '0 0 10px var(--success)' : 'none' }}></div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.status ? 'ONLINE' : 'OFFLINE'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${u.role}`} style={{ letterSpacing: '0.5px' }}>{u.role}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}
                                    </td>
                                    <td>
                                        <select
                                            className="form-input"
                                            style={{ 
                                                padding: '0.5rem 1rem', 
                                                fontSize: '0.8rem', 
                                                width: 'auto', 
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 10,
                                                color: 'var(--text-secondary)'
                                            }}
                                            value={u.role}
                                            disabled={updating === u.user_id}
                                            onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                                        >
                                            {roles.map(r => (
                                                <option key={r.role_id} value={r.role_name}>{r.role_name.toUpperCase()}</option>
                                            ))}
                                        </select>
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

export default Users;
