import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Handshake, Search, ArrowRightLeft } from 'lucide-react';

const SkillExchangePage = () => {
    const { user } = useAuth();
    const [offers, setOffers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('offers');

    const [form, setForm] = useState({ skill_name: '', category: 'Programming', description: '', availability: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/skills/marketplace');
            setOffers(res.data.data.offers);
            setRequests(res.data.data.requests);
        } catch (error) {
            console.error('Failed to load marketplace', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (type) => { // type: 'offer' or 'request'
        try {
            await api.post(`/skills/${type}`, form);
            setForm({ skill_name: '', category: 'Programming', description: '', availability: '' });
            alert(`${type === 'offer' ? 'Offer' : 'Request'} posted successfully!`);
            loadData();
        } catch (error) {
            alert('Failed to post');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4 bg-teal-500/10 p-6 rounded-3xl border border-teal-500/20">
                <div className="p-3 bg-teal-500 rounded-2xl text-white">
                    <Handshake className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-primary">Skill Exchange</h1>
                    <p className="text-text-secondary font-medium">Campus peer learning marketplace. Teach skills or request help.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex gap-4 border-b border-edu-border mb-4">
                        <button onClick={() => setActiveTab('offers')} className={`p-4 font-bold transition-all border-b-2 ${activeTab === 'offers' ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                            Available Tutors (Offers)
                        </button>
                        <button onClick={() => setActiveTab('requests')} className={`p-4 font-bold transition-all border-b-2 ${activeTab === 'requests' ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                            Students Looking for Help (Requests)
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center p-8 text-text-muted">Loading marketplace...</div>
                    ) : (
                        <div className="space-y-4">
                            {(activeTab === 'offers' ? offers : requests).map(item => (
                                <div key={item.id} className="bg-surface-card p-6 rounded-2xl border border-edu-border shadow-sm flex items-start gap-4 hover:border-teal-500/30 transition-colors">
                                    <div className="w-12 h-12 bg-surface-main rounded-xl flex items-center justify-center font-black text-xl text-teal-500">
                                        {item.first_name[0]}{item.last_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-text-primary">{item.skill_name}</h3>
                                            <span className="px-2 py-0.5 bg-surface-main text-[10px] font-bold text-text-muted uppercase tracking-widest rounded-md">{item.category}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary mb-3">{item.description}</p>
                                        <div className="flex items-center justify-between text-xs text-text-muted">
                                            <span>Poser: {item.first_name} {item.last_name}</span>
                                            {item.availability && <span className="text-teal-500 font-medium">Available: {item.availability}</span>}
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-surface-main hover:bg-teal-500 hover:text-white border border-edu-border hover:border-teal-500 rounded-xl transition-all font-bold text-sm text-text-primary">
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right sidebar form */}
                <div className="bg-surface-card p-6 rounded-2xl border border-edu-border shadow-sm sticky top-24">
                    <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-teal-500" /> Need or offer a skill?
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Skill Name</label>
                            <input type="text" value={form.skill_name} onChange={e => setForm({ ...form, skill_name: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none" placeholder="e.g. Python, Calculus" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Category</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none">
                                <option>Programming</option>
                                <option>Design</option>
                                <option>Mathematics</option>
                                <option>Language</option>
                                <option>Science</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Description</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-24 bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none" placeholder="What exactly do you need or teach?" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Availability (If offering)</label>
                            <input type="text" value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none" placeholder="e.g. Weekends, Evenings" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => handlePost('offer')} className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 text-sm">Offer Skill</button>
                            <button onClick={() => handlePost('request')} className="flex-1 py-2.5 bg-surface-main border border-edu-border hover:border-text-primary text-text-primary font-bold rounded-xl transition-all text-sm">Request Help</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillExchangePage;
