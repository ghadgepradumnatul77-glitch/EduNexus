import React, { useState, useEffect } from 'react';
import { Shield, Globe, Users, Activity, AlertTriangle, CheckCircle, Search, MoreVertical, Ban, RefreshCw, Trash2 } from 'lucide-react';
import api from '../../utils/api'; // Assuming we use same api util but it handles relative /api

const PlatformDashboard = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({ total: 0, active: 0, suspended: 0 });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await api.get('/platform/tenants');
            const data = response.data.data;
            setTenants(data);

            setMetrics({
                total: data.length,
                active: data.filter(t => t.status === 'active').length,
                suspended: data.filter(t => t.status === 'suspended').length
            });
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.patch(`/platform/tenants/${id}/status`, {
                status: newStatus,
                reason: newStatus === 'suspended' ? 'Administrative review' : null
            });
            fetchTenants();
        } catch (error) {
            alert('Status update failed');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-surface-card p-8 rounded-[2rem] border border-border-subtle shadow-premium flex items-center gap-8 group hover:-translate-y-1 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Globe size={32} />
                    </div>
                    <div>
                        <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Total Tenancy</p>
                        <p className="text-4xl font-black text-text-primary tracking-tight leading-none">{metrics.total}</p>
                    </div>
                </div>
                <div className="bg-surface-card p-8 rounded-[2rem] border border-border-subtle shadow-premium flex items-center gap-8 group hover:-translate-y-1 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Operational</p>
                        <p className="text-4xl font-black text-text-primary tracking-tight leading-none">{metrics.active}</p>
                    </div>
                </div>
                <div className="bg-surface-card p-8 rounded-[2rem] border border-border-subtle shadow-premium flex items-center gap-8 group hover:-translate-y-1 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Suspended</p>
                        <p className="text-4xl font-black text-text-primary tracking-tight leading-none">{metrics.suspended}</p>
                    </div>
                </div>
            </div>

            {/* Tenant Table Section */}
            <div className="bg-surface-card rounded-[2.5rem] border border-border-subtle shadow-premium overflow-hidden">
                <div className="p-10 border-b border-border-subtle flex flex-wrap items-center justify-between gap-8 bg-surface-main/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                            <Shield size={24} />
                        </div>
                        <h2 className="text-xl font-black text-text-primary tracking-tight">Active Tenancy Matrix</h2>
                    </div>
                    <div className="relative group w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" size={18} />
                        <input
                            placeholder="Filter by Domain/ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-surface-main border border-border-subtle rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold placeholder:text-text-muted/40"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-main/30">
                            <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-main/30">
                                <th className="px-10 py-5 text-left">Identity</th>
                                <th className="px-10 py-5 text-left">Domain Vector</th>
                                <th className="px-10 py-5 text-left">Internal ID</th>
                                <th className="px-10 py-5 text-left">Status</th>
                                <th className="px-10 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-surface-main/50 transition-colors">
                                    <td className="px-10 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-surface-main flex items-center justify-center font-bold text-text-muted text-lg">
                                                {tenant.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-text-primary">{tenant.name}</p>
                                                <p className="text-sm text-text-muted font-mono italic">{tenant.slug}.nexus</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-5 text-sm font-mono text-text-primary">
                                        {tenant.id.slice(0, 18)}...
                                    </td>
                                    <td className="px-10 py-5 text-sm font-mono text-text-muted">
                                        {tenant.id.slice(0, 8)}
                                    </td>
                                    <td className="px-10 py-5">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide
                                            ${tenant.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                                tenant.status === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-text-muted/10 text-text-muted'}`}>
                                            {tenant.status === 'active' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                            {tenant.status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {tenant.status === 'active' ? (
                                                <button
                                                    onClick={() => handleStatusUpdate(tenant.id, 'suspended')}
                                                    className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors tooltip"
                                                    title="Suspend Tenant"
                                                >
                                                    <Ban size={20} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusUpdate(tenant.id, 'active')}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Reactivate Tenant"
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                            )}
                                            <button className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
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

export default PlatformDashboard;
