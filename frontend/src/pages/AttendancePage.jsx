import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import api from '../utils/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];

const StatusBadge = ({ status }) => {
    const colors = {
        present: 'bg-green-100 text-green-700',
        absent: 'bg-red-100 text-red-700',
        late: 'bg-yellow-100 text-yellow-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

// ─── Faculty / Admin: Mark Attendance ─────────────────────────────────────────

const MarkAttendance = () => {
    const [date, setDate] = useState(today());
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    const loadStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users?role=Student&limit=200');
            const list = res.data.data?.users || res.data.data || [];
            setStudents(list);
            const initial = {};
            list.forEach(s => { initial[s.id] = 'present'; });
            setAttendance(initial);
        } catch {
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    const toggle = (id) =>
        setAttendance(a => ({ ...a, [id]: a[id] === 'present' ? 'absent' : 'present' }));

    const submit = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const records = Object.entries(attendance).map(([student_id, status]) => ({
                student_id,
                status,
                date
            }));
            await api.post('/attendance/bulk', { records });
            setMsg({ type: 'success', text: `✅ Attendance saved for ${records.length} students on ${date}` });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save attendance' });
        } finally {
            setSaving(false);
        }
    };

    const presentCount = Object.values(attendance).filter(v => v === 'present').length;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        max={today()}
                        onChange={e => setDate(e.target.value)}
                        className="bg-surface-main border border-border-subtle rounded-xl px-4 py-2 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                    />
                </div>
                <div className="ml-auto flex items-center gap-3 text-sm">
                    <span className="text-green-600 font-medium">Present: {presentCount}</span>
                    <span className="text-red-500 font-medium">Absent: {students.length - presentCount}</span>
                </div>
            </div>

            {msg && (
                <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-text-muted italic">Loading students...</div>
            ) : (
                <div className="bg-surface-card rounded-[2rem] shadow-premium overflow-hidden border border-border-subtle">
                    <div className="max-h-96 overflow-y-auto divide-y divide-border-subtle">
                        {students.length === 0 ? (
                            <p className="text-center py-12 text-gray-400 text-sm">No students found in this tenant.</p>
                        ) : students.map(s => (
                            <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-main/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
                                        {s.first_name?.[0]}{s.last_name?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-text-primary tracking-tight">{s.first_name} {s.last_name}</p>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{s.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggle(s.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors
                                        ${attendance[s.id] === 'present'
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                >
                                    {attendance[s.id] === 'present' ? '✓ Present' : '✗ Absent'}
                                </button>
                            </div>
                        ))}
                    </div>
                    {students.length > 0 && (
                        <div className="px-6 py-4 bg-surface-main/30 border-t border-border-subtle flex justify-end">
                            <button
                                onClick={submit}
                                disabled={saving}
                                className="btn-premium-accent px-8 py-2.5"
                            >
                                {saving ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Student: My Attendance ────────────────────────────────────────────────────

const MyAttendance = () => {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/attendance/my');
                setRecords(res.data.data?.records || []);
                setStats(res.data.data?.stats || null);
            } catch {
                setRecords([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const presentPct = stats
        ? Math.round((stats.present / (stats.total || 1)) * 100)
        : 0;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Days', value: stats?.total ?? '--', color: 'teal' },
                    { label: 'Present', value: stats?.present ?? '--', color: 'green' },
                    { label: 'Absent', value: stats?.absent ?? '--', color: 'red' },
                ].map(c => (
                    <div key={c.label} className={`bg-${c.color}-50 border border-${c.color}-100 rounded-xl p-4 text-center`}>
                        <p className={`text-3xl font-bold text-${c.color}-600`}>{c.value}</p>
                        <p className={`text-xs text-${c.color}-500 mt-1`}>{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="bg-surface-card rounded-[2rem] shadow-premium p-8 border border-border-subtle">
                <div className="flex justify-between text-sm mb-4">
                    <span className="font-black text-text-primary tracking-tight">Attendance Rate</span>
                    <span className={`font-black ${presentPct >= 75 ? 'text-green-500' : 'text-red-500'}`}>{presentPct}%</span>
                </div>
                <div className="w-full h-4 rounded-full bg-surface-main overflow-hidden border border-border-subtle">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-[0.2,0,0,1] ${presentPct >= 75 ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-red-500 shadow-lg shadow-red-500/20'}`}
                        style={{ width: `${presentPct}%` }}
                    />
                </div>
                {presentPct < 75 && (
                    <p className="text-xs text-red-500 mt-2">⚠️ Attendance below 75% threshold</p>
                )}
            </div>

            {/* Table */}
            <div className="bg-surface-card rounded-[2rem] shadow-premium overflow-hidden border border-border-subtle">
                <div className="px-6 py-4 bg-surface-main/30 border-b border-border-subtle">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-widest leading-none">Recent Records</h3>
                </div>
                {loading ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
                ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {records.slice(0, 30).map((r, i) => (
                            <div key={i} className="flex justify-between items-center px-6 py-4 text-sm hover:bg-surface-main/20 transition-colors">
                                <span className="text-text-secondary font-medium tracking-tight">{r.date}</span>
                                <StatusBadge status={r.status} />
                            </div>
                        ))}
                        {records.length === 0 && (
                            <p className="text-center py-8 text-gray-400 text-sm">No attendance records found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const AttendancePage = () => {
    const { user } = useAuth();
    const isStudent = user?.role === 'Student';

    return (
        <Layout>
            <div className="space-y-10 pb-20">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-none">Attendance</h1>
                    <p className="text-text-muted font-medium mt-3">
                        {isStudent ? 'Your academic engagement metrics' : 'Mark and track student presence'}
                    </p>
                </div>
                {isStudent ? <MyAttendance /> : <MarkAttendance />}
            </div>
        </Layout>
    );
};

export default AttendancePage;
