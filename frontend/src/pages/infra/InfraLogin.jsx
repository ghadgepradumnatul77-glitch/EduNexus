import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

const InfraLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('/api/platform/auth/login', { email, password });
            navigate('/infra/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Platform authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="max-w-md w-full">
                {/* Brand Logo / Identity */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 shadow-2xl mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Shield className="text-slate-300 w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-text-primary tracking-tight leading-none italic">EDUNEXUS</h1>
                    <p className="text-text-muted mt-3 font-bold tracking-[0.2em] uppercase text-[10px]">Infrastructure Control Plane</p>
                </div>

                <div className="bg-surface-card rounded-[3rem] shadow-premium-deep border border-edu-border p-12 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" aria-hidden="true"></div>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-3 animate-shake">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Operator ID</label>
                            <div className="mt-2 relative group-focus-within:scale-[1.02] transition-transform duration-300">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="email"
                                    placeholder="ops@edunexus.infra"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-surface-main border border-edu-border rounded-2xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Secure Key</label>
                            <div className="mt-2 relative group-focus-within:scale-[1.02] transition-transform duration-300">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-surface-main border border-edu-border rounded-2xl text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/20 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Verify Authorization
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-tighter uppercase">
                            <span>ENCRYPTION: AES-256-GCM</span>
                            <span>NODE: PROD-ALPHA-01</span>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-12 text-text-muted text-[10px] font-black tracking-widest uppercase">
                    &copy; 2026 EduNexus Systems &bull; Secure Environment
                </p>
            </div>
        </div>
    );
};

export default InfraLogin;
