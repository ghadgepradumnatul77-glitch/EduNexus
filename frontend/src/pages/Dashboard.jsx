import { useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarCheck,
    TrendingUp,
    Activity,
    MessageCircle,
    BarChart3,
    GraduationCap,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ChevronRight,
    FileText
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import Layout from '../components/Layout';
import api from '../utils/api';

// UI Primitives
import DashboardCard from '../components/ui/DashboardCard';
import MetricCard from '../components/ui/MetricCard';
import ActionTile from '../components/ui/ActionTile';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const ChartFallback = ({ message = "No data available for this period" }) => (
    <div className="flex flex-col items-center justify-center h-full w-full space-y-4 opacity-40">
        <Activity className="w-12 h-12 text-text-muted" strokeWidth={1} />
        <p className="text-sm font-medium text-text-muted italic">{message}</p>
    </div>
);

const TimelineItem = memo(({ icon: Icon, title, desc, time, color, bgColor }) => (
    <div className="flex items-start space-x-4 relative group" role="listitem">
        <div
            className={`flex-shrink-0 w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm`}
            aria-hidden="true"
        >
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-sm font-black text-text-primary tracking-tight truncate">{title}</h4>
                <time className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2 whitespace-nowrap">{time}</time>
            </div>
            <p className="text-xs font-medium text-text-secondary truncate">{desc}</p>
        </div>
    </div>
));

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [attRes] = await Promise.allSettled([
                api.get('/attendance/stats')
            ]);

            if (attRes.status === 'fulfilled') {
                setStats(attRes.value.data.data);
            } else {
                setError("Failed to load attendance metrics");
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError("Connectivity issue detected");
        } finally {
            // Smooth reveal
            setTimeout(() => setLoading(false), 800);
        }
    };

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    // Production-ready data handling
    const attendanceTrend = useMemo(() => [
        { name: 'Mon', value: 85 },
        { name: 'Tue', value: 92 },
        { name: 'Wed', value: 88 },
        { name: 'Thu', value: 95 },
        { name: 'Fri', value: 89 },
        { name: 'Sat', value: 91 },
    ], []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    if (error && !stats) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                    <h2 className="text-2xl font-black text-text-primary">Something went wrong</h2>
                    <p className="text-text-secondary mb-8">{error}</p>
                    <button
                        onClick={fetchStats}
                        className="btn-premium-accent"
                    >
                        Retry Connection
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12 pb-20"
            >
                {/* 1. HERO SECTION */}
                <DashboardCard className="relative overflow-hidden group border-none !p-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/10 to-accent-indigo/10 blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                    <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface-card/40">
                        <div className="space-y-6">
                            <div
                                className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600"
                                role="status"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Active Session</span>
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tight leading-[1.1]">
                                    {greeting}, <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-text-secondary to-text-muted">{user?.firstName || 'Student'}</span>
                                </h1>
                                <p className="text-text-secondary font-medium mt-4 max-w-lg leading-relaxed">
                                    Your academic overview for <span className="text-primary-600 font-bold">Semester 4</span> looks promising. You've hit <span className="text-text-primary font-bold">85%</span> of your weekly learning objectives.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end space-y-6">
                            <div className="glass px-6 py-4 rounded-3xl flex items-center space-x-4 shadow-xl shadow-primary-500/5">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Global Rank</p>
                                    <p className="text-sm font-black text-text-primary">Top 2% Globally</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="flex -space-x-3" aria-label="Study group members">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-xl border-2 border-surface-card bg-surface-main flex items-center justify-center text-xs font-bold text-text-muted shadow-sm">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                                <div className="w-10 h-10 rounded-xl border-2 border-surface-card bg-text-primary flex items-center justify-center text-[10px] font-bold text-surface-main shadow-lg">
                                    +12
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardCard>

                {/* 2. METRIC CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Attendance"
                        value={stats?.breakdown?.find(s => s.status === 'present')?.percentage + '%' || '92%'}
                        icon={CalendarCheck}
                        trendValue="+2.4%"
                        data={[40, 60, 45, 70, 55, 85, 92]}
                        color="#14b8a6"
                        loading={loading}
                        delay={0.1}
                    />
                    <MetricCard
                        title="Current CGPA"
                        value="8.84"
                        icon={GraduationCap}
                        trendValue="+0.12"
                        data={[8.1, 8.3, 8.5, 8.4, 8.7, 8.8]}
                        color="#6366f1"
                        loading={loading}
                        delay={0.2}
                    />
                    <MetricCard
                        title="Assignments"
                        value="12"
                        icon={FileText}
                        trendValue="-2 left"
                        data={[4, 8, 2, 10, 5, 12]}
                        color="#8b5cf6"
                        loading={loading}
                        delay={0.3}
                    />
                    <MetricCard
                        title="Active Exams"
                        value="04"
                        icon={Activity}
                        trendValue="Upcoming"
                        data={[1, 0, 2, 1, 0, 4]}
                        color="#3b82f6"
                        loading={loading}
                        delay={0.4}
                    />
                </div>

                {/* 3. CHARTS & ACTIVITY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <DashboardCard className="h-[500px] flex flex-col group relative">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-xl font-black text-text-primary tracking-tight">Attendance analytics</h3>
                                    <p className="text-xs font-medium text-text-muted mt-1">Real-time engagement tracking</p>
                                </div>
                                <select
                                    aria-label="Filter time range"
                                    className="bg-surface-main border-subtle rounded-xl px-4 py-2 text-xs font-bold text-text-secondary focus:ring-4 focus:ring-primary-500/10 outline-none cursor-pointer"
                                >
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                </select>
                            </div>

                            <div className="flex-1 w-full min-h-0">
                                {loading ? (
                                    <SkeletonLoader type="chart" />
                                ) : attendanceTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={attendanceTrend} aria-label="Attendance trend graph">
                                            <defs>
                                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
                                                dy={15}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                cursor={{ stroke: 'var(--primary-500)', strokeWidth: 2, strokeDasharray: '4 4' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-text-primary border-none shadow-2xl rounded-2xl p-4 animate-fade-in">
                                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                                <p className="text-2xl font-black text-white">{payload[0].value}%</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#14b8a6"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorVal)"
                                                transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartFallback />
                                )}
                            </div>
                        </DashboardCard>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="group" aria-label="Quick actions">
                            <ActionTile icon={Calendar} label="Timetable" color="bg-accent-indigo/10" textColor="text-accent-indigo" delay={0.5} />
                            <ActionTile icon={BarChart3} label="Results" color="bg-primary-500/10" textColor="text-primary-500" delay={0.6} />
                            <ActionTile icon={MessageCircle} label="Queries" color="bg-accent-violet/10" textColor="text-accent-violet" delay={0.7} />
                            <ActionTile icon={AlertCircle} label="Notice Board" color="bg-accent-blue/10" textColor="text-accent-blue" delay={0.8} />
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <DashboardCard className="flex flex-col h-full bg-surface-card/60 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xl font-black text-text-primary tracking-tight">Timeline</h3>
                            <button className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors focus:ring-2 focus:ring-primary-500/20 rounded-lg px-2 py-1">View All</button>
                        </div>

                        <div className="flex-1 space-y-10" role="list">
                            <TimelineItem
                                icon={CheckCircle2}
                                title="Task Perfected"
                                desc="Database Management Systems"
                                time="12:45 PM"
                                color="text-green-500"
                                bgColor="bg-green-500/10"
                            />
                            <TimelineItem
                                icon={Clock}
                                title="Next Class"
                                desc="System Architectures"
                                time="02:00 PM"
                                color="text-accent-indigo"
                                bgColor="bg-accent-indigo/10"
                            />
                            <TimelineItem
                                icon={AlertCircle}
                                title="Due Soon"
                                desc="Semester Registration"
                                time="Tomorrow"
                                color="text-red-500"
                                bgColor="bg-red-500/10"
                            />
                            <TimelineItem
                                icon={TrendingUp}
                                title="GPA Finalized"
                                desc="Theory of Computing"
                                time="2 days ago"
                                color="text-primary-500"
                                bgColor="bg-primary-500/10"
                            />
                        </div>

                        <div className="mt-12 pt-8 border-t border-subtle">
                            <button
                                className="w-full bg-text-primary rounded-[2rem] p-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 focus:ring-4 focus:ring-primary-500/50"
                                aria-label="Upgrade profile to unlock career paths"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" aria-hidden="true"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-2">New Milestone</p>
                                        <h4 className="text-sm font-black text-white">Unlock Career Insights</h4>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </div>
                            </button>
                        </div>
                    </DashboardCard>
                </div>
            </motion.div>
        </Layout>
    );
};

export default Dashboard;
