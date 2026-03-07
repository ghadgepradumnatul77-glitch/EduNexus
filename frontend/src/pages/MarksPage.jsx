import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import api from '../utils/api';

// ─── Student: My Marks ────────────────────────────────────────────────────────

const MyMarks = () => {
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/marks/my');
                setMarks(res.data.data || []);
            } catch {
                setMarks([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const avg = marks.length
        ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length)
        : 0;

    const grade = avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : 'D';
    const gradeColor = avg >= 80 ? 'text-green-600' : avg >= 60 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-teal-600">{marks.length}</p>
                    <p className="text-xs text-teal-500 mt-1">Exams Taken</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{avg}%</p>
                    <p className="text-xs text-green-500 mt-1">Average Score</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <p className={`text-3xl font-bold ${gradeColor}`}>{grade}</p>
                    <p className="text-xs text-teal-500 mt-1">Overall Grade</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface-card rounded-[2rem] shadow-premium overflow-hidden border border-subtle">
                <div className="px-6 py-4 bg-surface-main/30 border-b border-subtle">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-widest leading-none">Exam History</h3>
                </div>
                {loading ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-subtle bg-surface-main/20">
                                    <th className="px-6 py-4 text-left">Exam</th>
                                    <th className="px-6 py-4 text-left">Type</th>
                                    <th className="px-6 py-4 text-left">Score</th>
                                    <th className="px-6 py-4 text-left">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {marks.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-10 text-gray-400">No marks found.</td></tr>
                                ) : marks.map((m, i) => {
                                    const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                                    const barColor = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                                    return (
                                        <tr key={i} className="hover:bg-surface-main/50 transition-colors group">
                                            <td className="px-6 py-4 font-black text-text-primary tracking-tight">{m.exam_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-primary-500/10 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-500/10 transition-all group-hover:bg-primary-500/20">{m.exam_type}</span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-text-secondary">{m.marks_obtained}/{m.max_marks}</td>
                                            <td className="px-6 py-4 w-40">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 rounded-full bg-surface-main overflow-hidden border border-subtle">
                                                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-text-muted w-8">{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Faculty / Admin: Upload Marks ────────────────────────────────────────────

const UploadMarks = () => {
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});
    const [examName, setExamName] = useState('');
    const [examType, setExamType] = useState('weekly');
    const [maxMarks, setMaxMarks] = useState(100);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get('/users?role=Student&limit=200');
                const list = res.data.data?.users || res.data.data || [];
                setStudents(list);
                const init = {};
                list.forEach(s => { init[s.id] = ''; });
                setMarks(init);
            } catch {
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const submit = async () => {
        if (!examName.trim()) {
            setMsg({ type: 'error', text: 'Please enter an exam name.' });
            return;
        }
        setSaving(true);
        setMsg(null);
        try {
            const records = Object.entries(marks)
                .filter(([, v]) => v !== '' && !isNaN(Number(v)))
                .map(([student_id, marks_obtained]) => ({
                    student_id,
                    exam_name: examName,
                    exam_type: examType,
                    marks_obtained: Number(marks_obtained),
                    max_marks: Number(maxMarks)
                }));
            await api.post('/marks/bulk', { records });
            setMsg({ type: 'success', text: `✅ Marks saved for ${records.length} students.` });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save marks' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Exam Info */}
            <div className="bg-surface-card rounded-[2rem] shadow-premium p-8 border border-subtle grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Exam Name *</label>
                    <input
                        value={examName}
                        onChange={e => setExamName(e.target.value)}
                        placeholder="e.g. Midterm Exam"
                        className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-2 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-text-muted/50"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Type</label>
                    <select
                        value={examType}
                        onChange={e => setExamType(e.target.value)}
                        className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-2 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all cursor-pointer"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="assignment">Assignment</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Max Marks</label>
                    <input
                        type="number"
                        value={maxMarks}
                        onChange={e => setMaxMarks(e.target.value)}
                        className="w-full bg-surface-main border border-subtle rounded-xl px-4 py-2 text-sm text-text-primary focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                    />
                </div>
            </div>

            {msg && (
                <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            {/* Student Entries */}
            <div className="bg-surface-card rounded-[2rem] shadow-premium overflow-hidden border border-subtle">
                <div className="px-6 py-4 bg-surface-main/30 border-b border-subtle flex justify-between items-center">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-widest leading-none">Enter Marks per Student</h3>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{students.length} students</span>
                </div>
                {loading ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
                ) : (
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {students.map(s => (
                            <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-main/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center text-xs font-black transition-transform group-hover:scale-110">
                                        {s.first_name?.[0]}{s.last_name?.[0]}
                                    </div>
                                    <p className="text-sm font-black text-text-primary tracking-tight">{s.first_name} {s.last_name}</p>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max={maxMarks}
                                    placeholder={`/ ${maxMarks}`}
                                    value={marks[s.id] || ''}
                                    onChange={e => setMarks(m => ({ ...m, [s.id]: e.target.value }))}
                                    className="w-24 bg-surface-main border border-subtle rounded-xl px-3 py-2 text-sm text-center text-text-primary font-black focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder:text-text-muted/50"
                                />
                            </div>
                        ))}
                    </div>
                )}
                {students.length > 0 && (
                    <div className="px-6 py-4 bg-surface-main/30 border-t border-subtle flex justify-end">
                        <button
                            onClick={submit}
                            disabled={saving}
                            className="btn-premium-accent px-8 py-2.5"
                        >
                            {saving ? 'Saving...' : 'Save Marks'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const MarksPage = () => {
    const { user } = useAuth();
    const isStudent = user?.role === 'Student';

    return (
        <Layout>
            <div className="space-y-10 pb-20">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-none">Marks</h1>
                    <p className="text-text-muted font-medium mt-3">
                        {isStudent ? 'Your academic performance analytics' : 'Manage and evaluate student grades'}
                    </p>
                </div>
                {isStudent ? <MyMarks /> : <UploadMarks />}
            </div>
        </Layout>
    );
};

export default MarksPage;
