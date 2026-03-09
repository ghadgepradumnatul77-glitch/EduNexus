import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Clock, Users, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import ActionTile from '../components/ui/ActionTile';

const FacultyDashboard = () => {
    const { user } = useAuth();

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12 pb-20"
            >
                {/* 1. HERO SECTION */}
                <div className="relative overflow-hidden group bg-surface-card/40 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 border border-edu-border shadow-sm">
                    <div className="space-y-4">
                        <div
                            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Faculty Hub</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-text-primary tracking-tight leading-[1.1]">
                                Hello, Prof. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-indigo">{user?.lastName || 'Faculty'}</span>
                            </h1>
                            <p className="text-text-secondary font-medium mt-4 max-w-lg leading-relaxed">
                                You have 2 classes scheduled today and 15 pending assignments to grade.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. QUICK ACTIONS */}
                <div className="bg-surface-card/60 rounded-[2.5rem] border border-edu-border p-8 backdrop-blur-xl">
                    <h3 className="text-xl font-black text-text-primary tracking-tight mb-8">Faculty Shortcuts</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="group">
                        <ActionTile icon={Calendar} label="My Schedule" color="bg-accent-indigo/10" textColor="text-accent-indigo" delay={0.1} />
                        <ActionTile icon={CheckCircle2} label="Mark Attendance" color="bg-emerald-500/10" textColor="text-emerald-500" delay={0.2} />
                        <ActionTile icon={BookOpen} label="Grade Assignments" color="bg-primary-500/10" textColor="text-primary-500" delay={0.3} />
                        <ActionTile icon={Users} label="My Advisees" color="bg-accent-violet/10" textColor="text-accent-violet" delay={0.4} />
                    </div>
                </div>
            </motion.div>
        </Layout>
    );
};

export default FacultyDashboard;
