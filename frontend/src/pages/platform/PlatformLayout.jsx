import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Globe, Settings, LogOut } from 'lucide-react';

const PlatformLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Logic to clear platform cookies/session
        navigate('/platform/login');
    };

    return (
        <div className="flex h-screen bg-surface-main font-sans text-text-primary overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white shadow-xl flex flex-col">
                <div className="p-8 border-b border-edu-border flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg transform rotate-3">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Platform Control</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <Link to="/platform" className="flex items-center gap-4 px-6 py-3.5 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
                        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-tight">System Node</span>
                    </Link>
                    <Link to="/platform/tenants" className="flex items-center gap-4 px-6 py-3.5 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
                        <Globe size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-tight">Tenancy Matrix</span>
                    </Link>
                    <Link to="/platform/settings" className="flex items-center gap-4 px-6 py-3.5 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
                        <Settings size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-tight">Core Config</span>
                    </Link>
                </nav>

                <div className="p-6 border-t border-edu-border">
                    <button
                        onClick={() => { localStorage.removeItem('platform_token'); navigate('/platform/login'); }}
                        className="flex items-center gap-4 w-full px-6 py-3.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl transition-all group font-bold"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>System Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                <header className="h-20 bg-surface-card border-b border-edu-border px-10 flex items-center justify-between shadow-premium sticky top-0 z-10">
                    <h1 className="text-text-muted font-black uppercase tracking-[0.2em] text-[10px]">Infrastructure Control Plane</h1>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-black text-text-primary tracking-tight">Platform Operator</p>
                            <p className="text-[9px] text-text-muted font-mono uppercase tracking-widest">Node: Cluster-Alpha-01</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-surface-main border border-edu-border flex items-center justify-center shadow-inner group cursor-help transition-transform hover:scale-105">
                            <Shield size={20} className="text-text-muted group-hover:text-primary-500 transition-colors" />
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default PlatformLayout;
