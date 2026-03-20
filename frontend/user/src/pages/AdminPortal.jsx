import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
import '../admin.css';

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN PORTAL — Maxton-inspired Premium Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

const AdminPortal = () => {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate              = useNavigate();

    useEffect(() => {
        api.get('/users/me')
            .then(r => {
                if (!['admin','vice_principal','hod'].includes(r.data.role)) {
                    navigate('/welcome');
                } else {
                    setUser(r.data);
                }
            })
            .catch(() => navigate('/login'))
            .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) return <Loader text="Loading Admin Portal…" />;
    if (!user)   return null;

    return (
        <div className="ap">
            {/* ── Sidebar ── */}
            <aside className="ap-sidebar">
                <div className="ap-sidebar-brand">
                    <span className="ap-logo-dot" />
                    <span className="ap-brand-text">PVG Admin</span>
                </div>

                <nav className="ap-nav">
                    <span className="ap-nav-section">MAIN</span>
                    <NavLink to="/admin" end className={n}>📊 Dashboard</NavLink>

                    {['admin','vice_principal'].includes(user.role) && (
                        <>
                            <span className="ap-nav-section">MANAGEMENT</span>
                            <NavLink to="/admin/users"  className={n}>👥 Users</NavLink>
                            <NavLink to="/admin/roles"  className={n}>🛡️ Roles &amp; RBAC</NavLink>
                            <NavLink to="/admin/audit"  className={n}>📜 Audit Log</NavLink>
                        </>
                    )}

                    {user.role === 'hod' && (
                        <>
                            <span className="ap-nav-section">DEPARTMENT</span>
                            <NavLink to="/admin/users" className={n}>👥 Faculty</NavLink>
                        </>
                    )}
                </nav>

                <div className="ap-sidebar-footer">
                    <div className="ap-user-chip">
                        <div className="ap-avatar">{user.username[0].toUpperCase()}</div>
                        <div>
                            <div className="ap-chip-name">{user.username}</div>
                            <div className="ap-chip-role">{user.role.replace('_',' ')}</div>
                        </div>
                    </div>
                    <button className="ap-nav-link" onClick={() => navigate('/welcome')}>🏠 Main App</button>
                    <button className="ap-nav-link ap-logout" onClick={() => {
                        api.post('/auth/logout').catch(()=>{});
                        localStorage.removeItem('token');
                        navigate('/login');
                    }}>🚪 Logout</button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="ap-main">
                <header className="ap-topbar">
                    <div>
                        <h1 className="ap-page-title">
                            {user.role === 'admin' ? 'System Administrator' :
                             user.role === 'vice_principal' ? 'Vice Principal Portal' : 'HOD Dashboard'}
                        </h1>
                        <p className="ap-page-sub">Welcome back, {user.username} 🎉</p>
                    </div>
                    <div className="ap-topbar-right">
                        <span className="ap-role-badge">{user.role.replace('_',' ')}</span>
                    </div>
                </header>

                <Routes>
                    <Route path="/"      element={<DashboardView role={user.role} />} />
                    <Route path="/users" element={<UsersView />} />
                    <Route path="/roles" element={<RolesView />} />
                    <Route path="/audit" element={<AuditView />} />
                </Routes>
            </main>
        </div>
    );
};

/* helper for NavLink className */
const n = ({isActive}) => `ap-nav-link${isActive ? ' active' : ''}`;

/* ═══════════════════════════════════════════════════════════════════
   Dashboard View — stats cards, donut chart, bar chart, activity
   ═══════════════════════════════════════════════════════════════════ */
const DashboardView = ({ role }) => {
    const [stats, setStats] = useState(null);
    const [audit, setAudit] = useState([]);

    useEffect(() => {
        api.get('/admin/stats').then(r => setStats(r.data)).catch(()=>{});
        api.get('/admin/audit').then(r => setAudit(r.data.slice(0, 5))).catch(()=>{});
    }, []);

    if (!stats) return <Loader />;

    const cards = [
        { label:'Total Users',    value: stats.total_users,    icon:'👥', color:'#6366f1', delta:'+12%' },
        { label:'Active Sessions',value: stats.active_sessions,icon:'⚡', color:'#06d6a0', delta:'+8%'  },
        { label:'Total Roles',    value: stats.total_roles,    icon:'🛡️', color:'#f59e0b', delta:''     },
        { label:'Token Events',   value: stats.total_tokens,   icon:'🔑', color:'#ec4899', delta:'+24%' },
    ];

    return (
        <div className="ap-dashboard">
            {/* Stat cards */}
            <div className="ap-stat-row">
                {cards.map((c,i) => (
                    <div key={i} className="ap-stat-card" style={{'--accent':c.color}}>
                        <div className="ap-stat-icon">{c.icon}</div>
                        <div>
                            <div className="ap-stat-label">{c.label}</div>
                            <div className="ap-stat-val">{c.value}</div>
                        </div>
                        {c.delta && <span className="ap-stat-delta">{c.delta}</span>}
                        <MiniSparkline color={c.color} />
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="ap-charts-row">
                <div className="ap-chart-card">
                    <h3 className="ap-card-title">Role Distribution</h3>
                    <DonutChart />
                </div>
                <div className="ap-chart-card ap-chart-wide">
                    <h3 className="ap-card-title">Logins This Week</h3>
                    <BarChart />
                </div>
            </div>

            {/* Activity */}
            <div className="ap-chart-card">
                <h3 className="ap-card-title">Recent Activity</h3>
                <div className="ap-activity-list">
                    {audit.length === 0 && <p style={{color:'#64748b'}}>No recent activity.</p>}
                    {audit.map((a,i) => (
                        <div key={i} className="ap-activity-row">
                            <span className={`ap-act-dot ${a.action === 'Login' ? 'green' : 'red'}`} />
                            <div>
                                <strong>{a.user}</strong> — {a.action}
                                <div className="ap-act-meta">{a.timestamp} • {a.ip || 'unknown'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   Users View — full user table with inline role editing
   ═══════════════════════════════════════════════════════════════════ */
const UsersView = () => {
    const [users, setUsers]   = useState([]);
    const [roles, setRoles]   = useState([]);
    const [saving, setSaving] = useState(null);

    const load = useCallback(() => {
        api.get('/admin/users').then(r => setUsers(r.data));
        api.get('/admin/roles').then(r => setRoles(r.data));
    }, []);

    useEffect(load, [load]);

    const changeRole = async (uid, newRole) => {
        setSaving(uid);
        try {
            await api.post('/roles/assign', { user_id: uid, role: newRole });
            load();
        } catch { alert('Failed to change role'); }
        setSaving(null);
    };

    return (
        <div className="ap-section">
            <div className="ap-section-head">
                <h2>User Management</h2>
                <span className="ap-count">{users.length} users</span>
            </div>
            <div className="ap-table-wrap">
                <table className="ap-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Username</th><th>Email</th>
                            <th>Current Role</th><th>Change Role</th><th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.user_id}>
                                <td className="ap-td-id">{u.user_id}</td>
                                <td>
                                    <div className="ap-user-cell">
                                        <div className="ap-avatar-sm">{u.username[0].toUpperCase()}</div>
                                        {u.username}
                                    </div>
                                </td>
                                <td>{u.email}</td>
                                <td><span className={`ap-role-pill ${u.role}`}>{u.role}</span></td>
                                <td>
                                    <select
                                        value={u.role}
                                        disabled={saving === u.user_id}
                                        onChange={e => changeRole(u.user_id, e.target.value)}
                                        className="ap-select"
                                    >
                                        {roles.map(r => (
                                            <option key={r.role_id} value={r.role_name}>{r.role_name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="ap-td-date">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   Roles / RBAC View — cards for each role
   ═══════════════════════════════════════════════════════════════════ */
const PERM_MATRIX = {
    admin:           ['View Users','Edit Roles','Manage Tokens','View Audit','System Config','Flush DB'],
    vice_principal:  ['View Users','Edit Roles','View Audit','Manage Faculty'],
    hod:             ['View Users','View Audit','Manage Faculty'],
    faculty:         ['View Profile','View Attendance'],
    student:         ['View Profile'],
    guest:           ['View Profile'],
};

const RolesView = () => {
    const [roles, setRoles] = useState([]);
    useEffect(() => { api.get('/admin/roles').then(r => setRoles(r.data)); }, []);

    return (
        <div className="ap-section">
            <div className="ap-section-head"><h2>Roles &amp; RBAC</h2></div>
            <div className="ap-role-grid">
                {roles.map(r => {
                    const perms = PERM_MATRIX[r.role_name] || ['View Profile'];
                    return (
                        <div key={r.role_id} className="ap-role-card">
                            <div className="ap-role-card-head">
                                <span className={`ap-role-pill ${r.role_name}`}>{r.role_name.replace('_',' ')}</span>
                                <span className="ap-role-user-ct">{r.user_count} users</span>
                            </div>
                            <p className="ap-role-desc">{r.description || 'No description'}</p>
                            <div className="ap-perm-list">
                                {perms.map((p,i) => (
                                    <div key={i} className="ap-perm-row">
                                        <span className="ap-perm-check">✅</span> {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   Audit View — full audit log table
   ═══════════════════════════════════════════════════════════════════ */
const AuditView = () => {
    const [audit, setAudit] = useState([]);
    useEffect(() => { api.get('/admin/audit').then(r => setAudit(r.data)); }, []);

    return (
        <div className="ap-section">
            <div className="ap-section-head"><h2>Audit Log</h2></div>
            <div className="ap-table-wrap">
                <table className="ap-table">
                    <thead>
                        <tr><th>Action</th><th>User</th><th>Detail</th><th>IP</th><th>Timestamp</th></tr>
                    </thead>
                    <tbody>
                        {audit.map((a,i) => (
                            <tr key={i}>
                                <td><span className={`ap-act-badge ${a.action.toLowerCase()}`}>{a.action}</span></td>
                                <td>{a.user}</td>
                                <td>{a.detail}</td>
                                <td className="ap-mono">{a.ip || '—'}</td>
                                <td className="ap-td-date">{a.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


/* ═══════════════════════════════════════════════════════════════════
   INLINE SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

const Loader = ({text}) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#94a3b8',gap:'1rem',flexDirection:'column'}}>
        <div className="spinner large" />
        {text && <p>{text}</p>}
    </div>
);

/* SVG mini sparkline */
const MiniSparkline = ({color}) => {
    const pts = Array.from({length:7},(_,i)=>20+Math.random()*30);
    const d = pts.map((y,i)=>`${i===0?'M':'L'}${i*20},${50-y}`).join(' ');
    return (
        <svg className="ap-spark" viewBox="0 0 120 50" fill="none">
            <path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
};

/* SVG donut chart */
const DonutChart = () => {
    const data = [
        {label:'Admin',  pct:15, color:'#6366f1'},
        {label:'Faculty', pct:30, color:'#06d6a0'},
        {label:'Student', pct:40, color:'#f59e0b'},
        {label:'Guest',   pct:15, color:'#ec4899'},
    ];
    let offset = 0;
    return (
        <div className="ap-donut-wrap">
            <svg viewBox="0 0 120 120" className="ap-donut-svg">
                {data.map((d,i) => {
                    const r = 50, C = 2*Math.PI*r;
                    const dash = (d.pct/100)*C;
                    const el = <circle key={i} cx="60" cy="60" r={r}
                        fill="none" stroke={d.color} strokeWidth="12"
                        strokeDasharray={`${dash} ${C-dash}`}
                        strokeDashoffset={-offset}
                        style={{transition:'all .8s ease'}} />;
                    offset += dash;
                    return el;
                })}
                <text x="60" y="56" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">100%</text>
                <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="8">Total</text>
            </svg>
            <div className="ap-donut-legend">
                {data.map((d,i) => (
                    <div key={i} className="ap-legend-row">
                        <span className="ap-legend-dot" style={{background:d.color}} />
                        <span>{d.label}</span>
                        <span className="ap-legend-pct">{d.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* SVG bar chart */
const BarChart = () => {
    const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const vals  = [12, 28, 18, 35, 22, 8, 14];
    const vals2 = [8, 15, 12, 20, 16, 5, 10];
    const max   = Math.max(...vals) + 5;
    const bw    = 28, gap = 18;
    const w     = days.length*(bw*2+gap)+gap;

    return (
        <div className="ap-bar-wrap">
            <svg viewBox={`0 0 ${w} 160`} className="ap-bar-svg">
                {/* grid lines */}
                {[0,40,80,120].map(y => (
                    <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="rgba(255,255,255,.04)" />
                ))}
                {days.map((d,i) => {
                    const x = gap + i*(bw*2+gap);
                    const h1 = (vals[i]/max)*120;
                    const h2 = (vals2[i]/max)*120;
                    return (
                        <g key={i}>
                            <rect x={x} y={130-h1} width={bw} height={h1} rx="4" fill="#f59e0b">
                                <animate attributeName="height" from="0" to={h1} dur=".6s" fill="freeze" />
                                <animate attributeName="y" from="130" to={130-h1} dur=".6s" fill="freeze" />
                            </rect>
                            <rect x={x+bw+2} y={130-h2} width={bw} height={h2} rx="4" fill="#38bdf8">
                                <animate attributeName="height" from="0" to={h2} dur=".6s" fill="freeze" />
                                <animate attributeName="y" from="130" to={130-h2} dur=".6s" fill="freeze" />
                            </rect>
                            <text x={x+bw} y="148" textAnchor="middle" fill="#64748b" fontSize="9">{d}</text>
                        </g>
                    );
                })}
            </svg>
            <div className="ap-bar-legend">
                <span><span className="ap-legend-dot" style={{background:'#f59e0b'}} /> Logins</span>
                <span><span className="ap-legend-dot" style={{background:'#38bdf8'}} /> Logouts</span>
            </div>
        </div>
    );
};


export default AdminPortal;
