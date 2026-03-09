import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { PackageSearch, MapPin, Search, PlusCircle, CheckCircle2 } from 'lucide-react';

const LostFoundPage = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [form, setForm] = useState({ item_name: '', description: '', category: 'Electronics', status: 'lost', location: '', image_url: '' });

    useEffect(() => {
        loadItems();
    }, [filterCategory, filterStatus]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterCategory) params.append('category', filterCategory);
            if (filterStatus) params.append('status', filterStatus);

            const res = await api.get(`/lostfound/items?${params.toString()}`);
            setItems(res.data.data);
        } catch (error) {
            console.error('Failed to load items', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        try {
            await api.post('/lostfound/report', form);
            setShowForm(false);
            setForm({ item_name: '', description: '', category: 'Electronics', status: 'lost', location: '', image_url: '' });
            alert('Item reported successfully!');
            loadItems();
        } catch (error) {
            alert('Failed to report item');
        }
    };

    const handleClaim = async (id) => {
        if (!window.confirm('Mark this item as claimed?')) return;
        try {
            await api.post('/lostfound/claim', { id });
            loadItems();
        } catch (error) {
            alert('Failed to claim item. Only Admins can mark items as claimed directly via this basic UI flow.');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500 rounded-2xl text-white">
                        <PackageSearch className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-text-primary">Lost & Found</h1>
                        <p className="text-text-secondary font-medium">Report lost items or post found items securely.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                    <PlusCircle className="w-5 h-5" />
                    {showForm ? 'Cancel Form' : 'Report Item'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleReport} className="bg-surface-card p-6 rounded-2xl border border-edu-border shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Item Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none text-base">
                                <option value="lost">I Lost Something</option>
                                <option value="found">I Found Something</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Item Category</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none">
                                <option>Electronics</option>
                                <option>Books & Supplies</option>
                                <option>Clothing</option>
                                <option>Keys & ID</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Item Name</label>
                            <input type="text" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary focus:ring-2 focus:ring-amber-500 outline-none" required />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Detailed Description</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-24 bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Location Lost/Found</label>
                            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none" placeholder="e.g. Library 2nd Floor" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Image URL (Optional)</label>
                            <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="w-full bg-surface-main border border-edu-border rounded-xl px-4 py-2 text-text-primary outline-none" placeholder="https://" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-8 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">Submit Report</button>
                    </div>
                </form>
            )}

            <div className="flex gap-4 items-center bg-surface-card p-4 rounded-xl border border-edu-border shadow-sm">
                <Search className="w-5 h-5 text-text-muted" />
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-text-secondary">
                    <option value="">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Books & Supplies">Books & Supplies</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Keys & ID">Keys & ID</option>
                </select>
                <div className="w-px h-6 bg-edu-border mx-2"></div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-text-secondary">
                    <option value="">All Statuses</option>
                    <option value="lost">Lost Items</option>
                    <option value="found">Found Items</option>
                    <option value="claimed">Claimed/Resolved</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="text-center p-8 text-text-muted col-span-2">Loading items...</div>
                ) : items.length === 0 ? (
                    <div className="text-center p-12 bg-surface-main border border-edu-border rounded-2xl border-dashed col-span-2">
                        <PackageSearch className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-bold text-text-primary">No items found</h3>
                        <p className="text-text-secondary text-sm">Everything seems to be in its right place.</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="bg-surface-card rounded-2xl border border-edu-border shadow-sm overflow-hidden flex hover:shadow-md transition-shadow">
                            {item.image_url ? (
                                <div className="w-32 h-auto bg-surface-main">
                                    <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-32 h-auto bg-surface-main flex items-center justify-center border-r border-edu-border">
                                    <PackageSearch className="w-8 h-8 text-text-muted/50" />
                                </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold text-text-primary leading-tight">{item.item_name}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${item.status === 'lost' ? 'bg-red-500/10 text-red-500' :
                                                item.status === 'found' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-surface-main text-text-muted'
                                            }`}>{item.status}</span>
                                    </div>
                                    <p className="text-xs text-text-muted font-bold tracking-widest uppercase mb-2">{item.category}</p>
                                    <p className="text-sm text-text-secondary line-clamp-2">{item.description}</p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-edu-border flex items-center justify-between">
                                    <div className="text-xs text-text-muted flex items-center gap-1 font-semibold">
                                        <MapPin className="w-3 h-3" />
                                        {item.location}
                                    </div>
                                    {item.status !== 'claimed' && (user.role === 'Admin' || user.role === 'Super Admin') && (
                                        <button onClick={() => handleClaim(item.id)} className="text-xs font-bold text-primary-500 hover:text-primary-600 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LostFoundPage;
