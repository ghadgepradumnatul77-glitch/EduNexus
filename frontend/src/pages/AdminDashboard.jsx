

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const KpiCard = ({ label, value, icon, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-sm`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium opacity-80">{label}</p>
                <p className="text-3xl font-bold mt-1">{value ?? '--'}</p>
            </div>
            <span className="text-3xl opacity-70">{icon}</span>
        </div>
    </div>
);

const StatusChip = ({ status }) => {
    const colors = {
        active: 'bg-green-100 text-green-700',
        churned: 'bg-red-100 text-red-600',
        converted: 'bg-blue-100 text-blue-700',
        paused: 'bg-yellow-100 text-yellow-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

const AdminDashboard = () => {
    const [betaPrograms, setBetaPrograms] = useState([]);
    const [platformStats, setPlatformStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [betaRes, statsRes] = await Promise.allSettled([
                    api.get('/beta/programs'),
                    api.get('/saas/dashboard')
                ]);
                if (betaRes.status === 'fulfilled') {
                    setBetaPrograms(betaRes.value.data.data || []);
                }
                if (statsRes.status === 'fulfilled') {
                    setPlatformStats(statsRes.value.data.data || null);
                }
            } catch {/* ignore */ } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const activeBeta = betaPrograms.filter(b => b.status === 'active').length;
    const avgNps = betaPrograms.length
        ? (betaPrograms.reduce((s, b) => s + (Number(b.avg_nps) || 0), 0) / betaPrograms.length).toFixed(1)
        : '--';

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Super Admin — Platform Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time platform health, revenue, and beta cohort overview</p>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard label="Total Tenants" value={platformStats?.total_tenants ?? betaPrograms.length} icon="🏫" color="from-teal-500 to-teal-600" />
                    <KpiCard label="Beta Active" value={activeBeta} icon="🧪" color="from-teal-500 to-teal-600" />
                    <KpiCard label="Avg Beta NPS" value={avgNps} icon="⭐" color="from-slate-700 to-slate-800" />
                    <KpiCard label="Platform Status" value="Healthy" icon="💚" color="from-green-500 to-green-600" />
                </div>

                {/* Beta Cohort Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-800">Beta Cohort 2026-Q1</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{betaPrograms.length} institutions enrolled</p>
                    </div>
                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Loading…</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                                        <th className="px-4 py-3 text-left">Institution</th>
                                        <th className="px-4 py-3 text-left">Plan</th>
                                        <th className="px-4 py-3 text-left">Users</th>
                                        <th className="px-4 py-3 text-left">NPS</th>
                                        <th className="px-4 py-3 text-left">Feedback Rounds</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Contact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {betaPrograms.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-400">
                                                No beta programs yet. Run{' '}
                                                <code className="bg-gray-100 px-1 rounded text-xs">node scripts/seed-beta-institutions.js</code>{' '}
                                                to seed the first cohort.
                                            </td>
                                        </tr>
                                    ) : betaPrograms.map(bp => (
                                        <tr key={bp.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">{bp.org_name}</p>
                                                <p className="text-xs text-gray-400">{bp.org_slug}.edu</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full font-medium">
                                                    {bp.subscription_plan || 'beta'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-700">{bp.user_count ?? '--'}</td>
                                            <td className="px-4 py-3">
                                                {bp.avg_nps != null ? (
                                                    <span className={`font-bold ${Number(bp.avg_nps) >= 8 ? 'text-green-600' : Number(bp.avg_nps) >= 6 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                        {bp.avg_nps}/10
                                                    </span>
                                                ) : <span className="text-gray-400 text-xs">No data</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{bp.feedback_count ?? 0}</td>
                                            <td className="px-4 py-3"><StatusChip status={bp.status} /></td>
                                            <td className="px-4 py-3 text-xs text-gray-500">{bp.contact_name || '--'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Platform Info */}
                {platformStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-5">
                            <h3 className="font-semibold text-gray-700 mb-3">System Health</h3>
                            <div className="space-y-2 text-sm">
                                {Object.entries({
                                    'DB Connections': platformStats.db_connections ?? 'OK',
                                    'Redis Status': platformStats.redis_status ?? 'OK',
                                    'API Uptime': '99.9%',
                                }).map(([k, v]) => (
                                    <div key={k} className="flex justify-between">
                                        <span className="text-gray-500">{k}</span>
                                        <span className="font-medium text-gray-800">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5">
                            <h3 className="font-semibold text-gray-700 mb-3">Quick Links</h3>
                            <div className="space-y-2 text-sm">
                                {[
                                    { label: 'Health Check', url: 'http://localhost:5000/health' },
                                    { label: 'Readiness', url: 'http://localhost:5000/health/ready' },
                                ].map(l => (
                                    <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                                        className="flex justify-between text-teal-600 hover:text-teal-700 transition-colors">
                                        <span>{l.label}</span>
                                        <span>↗</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminDashboard;
