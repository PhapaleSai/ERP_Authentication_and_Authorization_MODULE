import React, { useState, useEffect } from 'react';
import api from '../api';

const ALL_PERMISSIONS = [
    { key: 'users.view', label: 'View Users', desc: 'Read user directory' },
    { key: 'users.edit', label: 'Edit Users', desc: 'Modify user profiles' },
    { key: 'roles.view', label: 'View Roles', desc: 'Read RBAC policies' },
    { key: 'roles.edit', label: 'Edit Roles', desc: 'Modify role permissions' },
    { key: 'audit.view', label: 'View Audit', desc: 'Access system logs' },
    { key: 'system.config', label: 'Config System', desc: 'Change system settings' },
    { key: 'db.ops', label: 'DB Operations', desc: 'Direct database access' },
    { key: 'reports.gen', label: 'Gen Reports', desc: 'Generate system reports' }
];

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState(null);
    const [selectedPerms, setSelectedPerms] = useState([]);
    const [saving, setSaving] = useState(false);

    const loadRoles = async () => {
        try {
            const res = await api.get('/admin/roles');
            setRoles(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRoles(); }, []);

    const openModal = (role) => {
        setEditingRole(role);
        setSelectedPerms(role.permissions || []);
    };

    const togglePermission = (permKey) => {
        setSelectedPerms(prev => 
            prev.includes(permKey) 
                ? prev.filter(p => p !== permKey) 
                : [...prev, permKey]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/roles/${editingRole.role_id}/permissions`, selectedPerms);
            await loadRoles();
            setEditingRole(null);
        } catch (err) {
            alert('Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Scrutinizing security protocols...</div>;

    return (
        <div>
            <header className="page-header">
                <h1 className="page-title">RBAC Architecture</h1>
                <p className="page-subtitle">Define granular access control across the enterprise.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {roles.map((role, i) => (
                    <div key={role.role_id} className="card" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <span className={`badge badge-${role.role_name}`} style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>{role.role_name}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{role.user_count} ACCOUNTS</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', minHeight: '3rem' }}>
                            {role.description || 'Core system role providing standard access levels to management features.'}
                        </p>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                            {(role.permissions || []).map(p => (
                                <span key={p} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--accent-primary)' }}>
                                    {p}
                                </span>
                            ))}
                            {(!role.permissions || role.permissions.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No special permissions</span>}
                        </div>

                        <button 
                            className="btn btn-primary btn-pulse" 
                            style={{ width: '100%', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
                            onClick={() => openModal(role)}
                        >
                            ⚡ Edit Access Policy
                        </button>
                    </div>
                ))}
            </div>

            {editingRole && (
                <div className="modal-overlay" onClick={() => setEditingRole(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '0.5rem' }}>Policy Editor</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            Editing permissions for <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{editingRole.role_name.toUpperCase()}</span>
                        </p>

                        <div className="permissions-grid">
                            {ALL_PERMISSIONS.map(perm => (
                                <div 
                                    key={perm.key} 
                                    className={`permission-toggle ${selectedPerms.includes(perm.key) ? 'active' : ''}`}
                                    onClick={() => togglePermission(perm.key)}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{perm.label}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{perm.desc}</div>
                                    </div>
                                    <div className="toggle-switch">
                                        <div className="toggle-knob"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                            <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onClick={() => setEditingRole(null)}>
                                Discard Changes
                            </button>
                            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                                {saving ? 'Synchronizing...' : 'Apply Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
