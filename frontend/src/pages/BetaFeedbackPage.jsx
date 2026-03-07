import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const STAR_LABELS = ['', 'Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];

const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-gray-200'}`}
            >
                ★
            </button>
        ))}
        {value > 0 && <span className="ml-3 text-[10px] font-black text-text-muted uppercase tracking-widest self-center opacity-60">{STAR_LABELS[value]}</span>}
    </div>
);

const NpsSlider = ({ value, onChange }) => {
    const color = value >= 9 ? 'text-green-600' : value >= 7 ? 'text-yellow-500' : 'text-red-500';
    const label = value >= 9 ? 'Promoter 🚀' : value >= 7 ? 'Passive 😐' : 'Detractor 😟';
    return (
        <div>
            <div className="flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 opacity-60">
                <span>0 – Not at all likely</span>
                <span>10 – Extremely likely</span>
            </div>
            <input
                type="range" min={0} max={10} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full accent-teal-600"
            />
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-400 flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <span key={n} className={`w-5 text-center ${n === value ? 'font-bold text-indigo-600' : ''}`}>{n}</span>
                    ))}
                </span>
            </div>
            {value > 0 && (
                <p className={`text-sm font-medium mt-1 ${color}`}>{label}</p>
            )}
        </div>
    );
};

const BetaFeedbackPage = () => {
    const [form, setForm] = useState({
        nps_score: 8,
        overall_rating: 4,
        friction_points: '',
        feature_requests: '',
        positive_highlights: '',
        would_pay: false,
        willing_to_refer: false,
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        api.get('/beta/feedback')
            .then(r => setHistory(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await api.post('/beta/feedback', form);
            setMsg({ type: 'success', text: '✅ Feedback submitted! Thank you for helping us improve EduNexus.' });
            const r = await api.get('/beta/feedback');
            setHistory(r.data.data || []);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-10 pb-20">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-none">Feedback</h1>
                    <p className="text-text-muted font-medium mt-3">Help us calibrate the internal ecosystem experience</p>
                </div>

                <form onSubmit={submit} className="bg-surface-card rounded-[2rem] shadow-premium p-10 space-y-10 border border-edu-border">
                    {/* NPS */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            How likely are you to recommend EduNexus to another institution?
                        </label>
                        <NpsSlider value={form.nps_score} onChange={v => set('nps_score', v)} />
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Overall rating */}
                    <div>
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Overall Experience This Week</label>
                        <StarRating value={form.overall_rating} onChange={v => set('overall_rating', v)} />
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Friction */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            What slowed you down or frustrated you? <span className="text-gray-400 font-normal">(friction points)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.friction_points}
                            onChange={e => set('friction_points', e.target.value)}
                            placeholder="e.g. Couldn't find where to bulk-import students…"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none resize-none"
                        />
                    </div>

                    {/* Feature requests */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            What features would make this 10x better?
                        </label>
                        <textarea
                            rows={3}
                            value={form.feature_requests}
                            onChange={e => set('feature_requests', e.target.value)}
                            placeholder="e.g. Parent portal, SMS notifications, timetable builder…"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none resize-none"
                        />
                    </div>

                    {/* Positives */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            What worked really well? <span className="text-gray-400 font-normal">(highlights)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={form.positive_highlights}
                            onChange={e => set('positive_highlights', e.target.value)}
                            placeholder="e.g. Attendance marking was super fast…"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none resize-none"
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {[
                            { field: 'would_pay', label: '💳 I would pay for EduNexus today' },
                            { field: 'willing_to_refer', label: '📢 I would refer another institution' },
                        ].map(c => (
                            <label key={c.field} className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form[c.field]}
                                    onChange={e => set(c.field, e.target.checked)}
                                    className="w-4 h-4 accent-teal-600"
                                />
                                <span className="text-sm text-gray-700">{c.label}</span>
                            </label>
                        ))}
                    </div>

                    {msg && (
                        <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {msg.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Submitting…' : 'Submit Weekly Check-In'}
                    </button>
                </form>

                {/* History */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-800">Submission History</h2>
                    </div>
                    {loading ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
                    ) : history.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 text-sm">No submissions yet — be the first this week!</p>
                    ) : (
                        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                            {history.map(h => (
                                <div key={h.id} className="px-5 py-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">Week {h.week_number}, {h.year}</span>
                                        <div className="flex gap-3 text-sm">
                                            <span className="text-yellow-500">{'★'.repeat(h.overall_rating || 0)}</span>
                                            <span className="text-indigo-600 font-medium">NPS: {h.nps_score}/10</span>
                                        </div>
                                    </div>
                                    {h.friction_points && (
                                        <p className="text-xs text-gray-500 truncate">💢 {h.friction_points}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default BetaFeedbackPage;
