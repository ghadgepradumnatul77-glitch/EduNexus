import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import AnnouncementCard from '../components/AnnouncementCard';
import { Megaphone, Plus } from 'lucide-react';

const NoticeBoardPage = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({ title: '', content: '', priority_level: 'normal', visibility_scope: 'all_students' });

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            loadAnnouncements();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/announcements', form);
            setShowForm(false);
            setForm({ title: '', content: '', priority_level: 'normal', visibility_scope: 'all_students' });
            loadAnnouncements();
        } catch (error) {
            console.error('Failed to post', error);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-primary-500/10 p-6 rounded-3xl border border-primary-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-500 rounded-2xl text-white">
                        <Megaphone className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-text-primary">Smart Notice Board</h1>
                        <p className="text-text-secondary font-medium">Official campus announcements and bulletins.</p>
                    </div>
                </div>
                {(user.role === 'Admin' || user.role === 'Faculty' || user.role === 'Super Admin') && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        {showForm ? 'Cancel' : 'New Notice'}
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-surface-card p-6 rounded-2xl border border-edu-border shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Title</label>
                            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Message</label>
                            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full h-32 bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Priority</label>
                            <select value={form.priority_level} onChange={e => setForm({ ...form, priority_level: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none">
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Visibility</label>
                            <select value={form.visibility_scope} onChange={e => setForm({ ...form, visibility_scope: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none">
                                <option value="all_students">All Students</option>
                                <option value="faculty_only">Faculty Only</option>
                                <option value="department_specific">Department</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="submit" className="px-6 py-2 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors">Post Announcement</button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center p-8 text-text-muted">Loading notices...</div>
                ) : announcements.length === 0 ? (
                    <div className="text-center p-12 bg-surface-main border border-edu-border rounded-2xl border-dashed">
                        <Megaphone className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-bold text-text-primary">No Campus Notices</h3>
                        <p className="text-text-secondary text-sm">It's quiet around here. There are currently no active announcements.</p>
                    </div>
                ) : (
                    announcements.map(announcement => (
                        <AnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
                            currentUserId={user?.id}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default NoticeBoardPage;
