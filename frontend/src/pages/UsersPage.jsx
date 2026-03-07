import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const ROLES = ['Admin', 'Faculty', 'Student'];

const RoleBadge = ({ role }) => {
    const colors = {
        'Super Admin': 'bg-purple-100 text-purple-700',
        'Admin': 'bg-primary-500/10 text-primary-600',
        'Teacher': 'bg-blue-500/10 text-blue-500',
        'Student': 'bg-surface-main text-text-muted',
    };
    return (
        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${colors[role] || 'bg-surface-main text-text-muted'}`}>
            {role}
        </span>
    );
};

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showInvite, setShowInvite] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'Student', password: '' });
    const [formMsg, setFormMsg] = useState(null);
    const [saving, setSaving] = useState(false);
    const PER_PAGE = 20;

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: PER_PAGE,
                offset: (page - 1) * PER_PAGE,
                ...(roleFilter && { role: roleFilter }),
                ...(search && { search })
            });
            const res = await api.get(`/users?${params.toString()}`);
            const data = res.data.data;
            setUsers(data?.users || data || []);
            setTotal(data?.total || (data?.users || data || []).length);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [page, roleFilter, search]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const deactivate = async (id) => {
        if (!window.confirm('Are you sure you want to suspend this user?')) return;
        try {
            await api.put(`/users/${id}`, { is_active: false });
            loadUsers();
        } catch {/* ignore */ }
    };

    const resetPassword = async (email) => {
        try {
            await api.post('/auth/forgot-password', { email });
            alert(`✅ Reset link sent to ${email}`);
        } catch (err) {
            alert('Failed to send reset link');
        }
    };

    const changeRole = async (id, newRole) => {
        try {
            // Find role ID for the name
            const rolesRes = await api.get('/users/roles');
            const roleObj = rolesRes.data.data.find(r => r.name === newRole);
            if (!roleObj) return;

            await api.put(`/users/${id}`, { roleId: roleObj.id });
            loadUsers();
        } catch {/* ignore */ }
    };

    const createUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormMsg(null);
        try {
            await api.post('/users', { ...form, role_name: form.role });
            setFormMsg({ type: 'success', text: `✅ User ${form.email} created!` });
            setForm({ first_name: '', last_name: '', email: '', role: 'Student', password: '' });
            loadUsers();
        } catch (err) {
            setFormMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user' });
        } finally {
            setSaving(false);
        }
    };

    const totalPages = Math.ceil(total / PER_PAGE);

    return (
        <Layout>
            <div className="space-y-10 pb-20">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-none">Users</h1>
                        <p className="text-text-muted font-medium mt-3">Identity and Access Management Control Plane</p>
                    </div>
                    <button
                        onClick={() => setShowInvite(!showInvite)}
                        className="btn-premium-accent px-6 py-3 flex items-center space-x-2 group"
                    >
                        <span>+ Add User</span>
                    </button>
                </div>

                {/* Invite Form */}
                {/* Invite Form */}
                {showInvite && (
                    <div className="bg-surface-card rounded-[2rem] shadow-premium p-10 border border-primary-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" aria-hidden="true"></div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight mb-8">Create New User</h3>
                        <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">First Name</label>
                                <input required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                    className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Last Name</label>
                                <input required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                    className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Email</label>
                                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Password</label>
                                <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Role</label>
                                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                    className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all cursor-pointer">
                                    {ROLES.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-6 mt-4">
                                {formMsg && (
                                    <p className={`text-sm font-bold ${formMsg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{formMsg.text}</p>
                                )}
                                <button type="submit" disabled={saving}
                                    className="ml-auto btn-premium-accent px-8 py-3">
                                    {saving ? 'Creating…' : 'Finalize Creation'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-6">
                    <div className="relative w-full max-w-sm group">
                        <input
                            placeholder="Search identities..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-surface-card border border-subtle rounded-xl px-10 py-3 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-text-muted/50"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-focus-within:text-primary-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <select
                        value={roleFilter}
                        onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                        className="bg-surface-card border border-subtle rounded-xl px-6 py-3 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all cursor-pointer font-bold"
                    >
                        <option value="">Full Directory</option>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <span className="ml-auto text-sm font-black text-text-muted uppercase tracking-widest">{total} identites</span>
                </div>

                {/* Table */}
                <div className="bg-surface-card rounded-[2rem] shadow-premium overflow-hidden border border-subtle">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-subtle bg-surface-main/30">
                                    <th className="px-6 py-4 text-left">Identity</th>
                                    <th className="px-6 py-4 text-left">Clearance</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center py-12 text-text-muted italic">Loading identities...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-12 text-text-muted italic">No identites found.</td></tr>
                                ) : users.map(u => (
                                    <tr key={u.id} className="hover:bg-surface-main/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center text-xs font-black flex-shrink-0 transition-transform group-hover:scale-110">
                                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-text-primary tracking-tight">{u.first_name} {u.last_name}</p>
                                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><RoleBadge role={u.role_name || u.role} /></td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.is_active !== false ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {u.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-6 text-[10px] font-black uppercase tracking-widest">
                                                <select
                                                    defaultValue={u.role_name || u.role}
                                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                                    className="bg-transparent border-none text-primary-500 hover:text-primary-600 focus:ring-0 cursor-pointer p-0 font-black"
                                                >
                                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>

                                                <button
                                                    onClick={() => resetPassword(u.email)}
                                                    className="text-text-muted hover:text-primary-500 transition-colors"
                                                >
                                                    Reset Pwd
                                                </button>

                                                {u.is_active !== false ? (
                                                    <button
                                                        onClick={() => deactivate(u.id)}
                                                        className="text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        Suspend
                                                    </button>
                                                ) : (
                                                    <span className="text-text-muted italic opacity-50">Suspended</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-surface-main/30 border-t border-subtle flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-4 py-2 rounded-xl border border-subtle disabled:opacity-30 hover:bg-surface-main transition-all">← Prev</button>
                            <span className="text-text-muted">Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-4 py-2 rounded-xl border border-subtle disabled:opacity-30 hover:bg-surface-main transition-all">Next →</button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default UsersPage;
