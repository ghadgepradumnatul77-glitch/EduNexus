import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    Users,
    GraduationCap,
    BookOpen,
    Clock,
    Megaphone,
    UserPlus,
    FilePlus,
    PlusCircle,
    CheckCircle2
} from 'lucide-react';
import Layout from '../components/Layout';
import MetricCard from '../components/ui/MetricCard';
import ActionTile from '../components/ui/ActionTile';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [loading] = useState(false);

    // Placeholder data to fulfill User UI requirements
    // In a real application, these would be fetched via API
    const metrics = {
        totalStudents: '4,250',
        totalFaculty: '312',
        activeCourses: '145',
        pendingApprovals: '28'
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    return (
        <Layout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12 pb-20"
            >
                {/* 1. HERO SECTION */}
                <div className="relative overflow-hidden group bg-surface-card/40 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 border border-edu-border shadow-sm">
                    <div className="space-y-4">
                        <div
                            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600"
                            role="status"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">University Administration</span>
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-[1.1]">
                                Welcome back, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-400 to-accent-indigo">{user?.firstName || 'Admin'}</span>
                            </h1>
                            <p className="text-text-secondary font-medium mt-4 max-w-lg leading-relaxed">
                                System operational. You have <span className="text-primary-600 font-bold">{metrics.pendingApprovals}</span> pending faculty approvals and system alerts requiring your attention.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. METRIC CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Students"
                        value={metrics.totalStudents}
                        icon={Users}
                        trendValue="+5.2%"
                        data={[4000, 4050, 4100, 4150, 4200, 4250]}
                        color="#14b8a6"
                        loading={loading}
                        delay={0.1}
                    />
                    <MetricCard
                        title="Total Faculty"
                        value={metrics.totalFaculty}
                        icon={GraduationCap}
                        trendValue="+2"
                        data={[300, 305, 308, 309, 310, 312]}
                        color="#6366f1"
                        loading={loading}
                        delay={0.2}
                    />
                    <MetricCard
                        title="Active Courses"
                        value={metrics.activeCourses}
                        icon={BookOpen}
                        trendValue="+12"
                        data={[120, 125, 130, 135, 140, 145]}
                        color="#8b5cf6"
                        loading={loading}
                        delay={0.3}
                    />
                    <MetricCard
                        title="Pending Approvals"
                        value={metrics.pendingApprovals}
                        icon={Clock}
                        trendValue="Needs Action"
                        data={[10, 15, 20, 25, 30, 28]}
                        color="#f59e0b"
                        loading={loading}
                        delay={0.4}
                    />
                </div>

                {/* 3. MANAGEMENT SHORTCUTS & NOTICES */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-surface-card/60 rounded-[2.5rem] border border-edu-border p-8 backdrop-blur-xl">
                            <h3 className="text-xl font-black text-text-primary tracking-tight mb-8">Management Shortcuts</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="group" aria-label="Management Quick Actions">
                                <ActionTile icon={UserPlus} label="Add Student" color="bg-accent-indigo/10" textColor="text-accent-indigo" delay={0.5} />
                                <ActionTile icon={Megaphone} label="Create Notice" color="bg-primary-500/10" textColor="text-primary-500" delay={0.6} />
                                <ActionTile icon={BookOpen} label="Create Course" color="bg-accent-violet/10" textColor="text-accent-violet" delay={0.7} />
                                <ActionTile icon={GraduationCap} label="Add Faculty" color="bg-emerald-500/10" textColor="text-emerald-500" delay={0.8} />
                                <ActionTile icon={FilePlus} label="Manage Terms" color="bg-amber-500/10" textColor="text-amber-500" delay={0.9} />
                                <ActionTile icon={PlusCircle} label="System Config" color="bg-slate-500/10" textColor="text-slate-500" delay={1.0} />
                            </div>
                        </div>
                    </div>

                    {/* Recent Notices */}
                    <div className="bg-surface-card/60 rounded-[2.5rem] border border-edu-border p-8 backdrop-blur-xl flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-text-primary tracking-tight">Recent Notices</h3>
                            <button className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors">View All</button>
                        </div>

                        <div className="flex-1 space-y-6" role="list">
                            {[
                                { title: 'Mid-term Exams Scheduled', time: '2 hours ago', type: 'urgent' },
                                { title: 'Campus Maintenance', time: '5 hours ago', type: 'info' },
                                { title: 'New Faculty Onboarding', time: '1 day ago', type: 'success' },
                            ].map((notice, idx) => (
                                <div key={idx} className="flex items-start space-x-4 relative group" role="listitem">
                                    <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm
                                            ${notice.type === 'urgent' ? 'bg-red-500/10 text-red-500' :
                                                notice.type === 'success' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-blue-500/10 text-blue-500'}`}
                                    >
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className="text-sm font-bold text-text-primary tracking-tight truncate">{notice.title}</h4>
                                        </div>
                                        <p className="text-xs font-medium text-text-muted">{notice.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </Layout>
    );
};

export default AdminDashboard;
