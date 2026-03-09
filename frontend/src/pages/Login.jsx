import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogIn, Mail, Lock, ShieldAlert, Eye, EyeOff,
    HelpCircle, BookOpen, ChevronRight, GraduationCap,
    UserCheck, ShieldCheck, Shield, LockKeyhole, BadgeCheck,
    Building2, MailCheck, Globe
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                const userRole = result.data.user.role?.toLowerCase() || '';
                if (userRole === 'student') navigate('/app/student-dashboard');
                else if (userRole === 'faculty') navigate('/app/faculty-dashboard');
                else if (userRole === 'super admin' || userRole === 'super_admin' || userRole === 'admin') navigate('/app/admin-dashboard');
                else navigate('/app/student-dashboard');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('System connectivity failed. Authorized access only.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex bg-surface-main font-sans overflow-hidden selection:bg-primary-500/20 selection:text-primary-500">

            {/* LEFT SIDE: Institutional Authority (60%) */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-[#0B1F3A] border-r-4 border-[#C8A951]/40">
                {/* Parallax Ken Burns Background */}
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1.05 }}
                    transition={{ duration: 15, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url(${BRAND_CONFIG.bgPath})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(0.4) contrast(1.2)'
                    }}
                />

                {/* Authoritative Navy Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/85 to-transparent z-10" />
                <div className="absolute inset-0 bg-[#0B1F3A]/30 mix-blend-multiply z-10" />

                {/* Left Side Content */}
                <div className="relative z-20 w-full h-full p-20 flex flex-col justify-between">
                    {/* Top Institutional Identity */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col space-y-6"
                    >
                        <div className="relative animate-float">
                            <div className="p-6 bg-surface-card rounded-3xl shadow-premium border-4 border-primary-500/30">
                                <img src={BRAND_CONFIG.logoPath} alt="PCU Crest" className="w-16 h-16 object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-white text-3xl font-black tracking-tight leading-none font-['Playfair_Display']">
                                    Pimpri Chinchwad <br />
                                    <span className="text-[#C8A951]">University</span>
                                </h2>
                                <p className="text-[#C8A951]/80 text-[10px] font-black tracking-[0.4em] uppercase mt-3">Established 1990 | Pune, India</p>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <span className="px-3 py-1 bg-surface-main/30 backdrop-blur-md rounded-full text-[9px] text-text-muted font-black uppercase tracking-widest border border-edu-border">Enterprise Grade</span>
                            <span className="px-3 py-1 bg-surface-main/30 backdrop-blur-md rounded-full text-[9px] text-text-muted font-black uppercase tracking-widest border border-edu-border">Secure Portal</span>
                        </div>
                    </motion.div>

                    {/* Authoritative Message */}
                    <div className="max-w-xl">
                        <motion.h1
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-8xl font-['Playfair_Display'] font-black text-white leading-none tracking-tighter"
                        >
                            Global <br />
                            <span className="text-[#0B1F3A] drop-shadow-[0_0_30px_rgba(200,169,81,0.5)] bg-clip-text text-transparent bg-gradient-to-r from-[#C8A951] to-[#E5C76B]">Authority.</span>
                        </motion.h1>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "120px" }}
                            className="h-1 bg-[#C8A951] my-10 shadow-[0_0_15px_rgba(200,169,81,0.6)]"
                        />
                        <p className="text-white/70 text-xl font-light leading-relaxed font-['Poppins']">
                            Access the official Digital Gateway of Pimpri Chinchwad University. Secure environment for authorized personnel only.
                        </p>
                    </div>

                    {/* Footer Authority Strip */}
                    <div className="flex items-end justify-between border-t border-white/10 pt-10">
                        <div className="flex space-x-12">
                            <div>
                                <p className="text-white text-3xl font-black font-['Inter']">5,000+</p>
                                <p className="text-[10px] uppercase tracking-widest font-black text-[#C8A951]/90">Authorized Students</p>
                            </div>
                            <div>
                                <p className="text-white text-3xl font-black font-['Inter']">1,200+</p>
                                <p className="text-[10px] uppercase tracking-widest font-black text-[#C8A951]/90">Faculty Members</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2 font-['Inter']">Powered by</p>
                            <p className="text-white font-bold text-sm">University IT Department</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Structured Login Workspace (40%) */}
            <div className="w-full lg:w-2/5 relative flex flex-col justify-between bg-[#FDFDFD] overflow-y-auto">
                <div className="p-12 md:p-20 flex-1 flex flex-col justify-center">

                    {/* Crest Watermark behind form */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none -z-10">
                        <img src={BRAND_CONFIG.logoPath} alt="Watermark" className="w-[80%] h-auto object-contain grayscale" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-[420px] mx-auto"
                    >
                        {/* Security Headers */}
                        <header className="mb-14 flex flex-col items-center lg:items-start relative">
                            {/* Subtle warm lighting highlight on card region */}
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#C8A951]/5 blur-[60px] rounded-full pointer-events-none" />

                            <div className="mb-8 w-full flex justify-center lg:justify-start">
                                <img src={BRAND_CONFIG.fullLogoPath} alt="University Logo" className="h-24 w-auto object-contain" />
                            </div>

                            <span className="text-[#C8A951] font-black uppercase tracking-[0.3em] text-[10px] mb-3">Official Access Portal</span>
                            <h1 className="text-4xl font-['Playfair_Display'] font-black text-[#050B14] tracking-tight leading-tight mb-3 text-center lg:text-left">
                                Pimpri Chinchwad <br className="hidden lg:block" /> University <span className="text-[#0B1F3A]">ERP</span>
                            </h1>
                            <p className="text-text-muted font-bold text-sm tracking-widest text-center lg:text-left uppercase">Academic Management Ecosystem</p>
                        </header>



                        <form onSubmit={handleSubmit} className="space-y-10">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-red-50 border-2 border-red-500/10 text-red-600 px-6 py-4 rounded-xl flex items-center space-x-4 mb-8"
                                    >
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-bold">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-8">
                                <div className="group space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0B1F3A]/60 group-focus-within:text-[#C8A951] transition-colors">University Email ID</label>
                                    <div className="flex items-center space-x-4 border-b-2 border-edu-border focus-within:border-primary-500 transition-all duration-300 pb-3">
                                        <Mail className="w-5 h-5 text-text-muted group-focus-within:text-primary-500" />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex-1 bg-transparent outline-none text-text-primary font-black text-lg placeholder:text-text-muted/30"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0B1F3A]/60 group-focus-within:text-[#C8A951] transition-colors">Digital Signature / Password</label>
                                    <div className="flex items-center space-x-4 border-b-2 border-edu-border focus-within:border-primary-500 transition-all duration-300 pb-3">
                                        <LockKeyhole className="w-5 h-5 text-text-muted group-focus-within:text-primary-500" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="flex-1 bg-transparent outline-none text-text-primary font-black text-lg placeholder:text-text-muted/30"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-text-muted hover:text-primary-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Authoritative Primary Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.01, backgroundColor: "#050B14" }}
                                whileTap={{ scale: 0.99 }}
                                className={`w-full py-6 bg-[#0B1F3A] text-white font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all duration-500 rounded-xl flex items-center justify-center space-x-3 border-b-4 border-[#C8A951]/60 ${loading ? 'brightness-90 cursor-wait' : ''
                                    }`}
                            >
                                {loading ? (
                                    <div className="flex items-center space-x-4 font-['Inter']">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>SYSTEM VALIDATING...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>AUTHORIZE ACCESS</span>
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Operator Login Link */}
                        <div className="mt-8 text-center border-t border-edu-border pt-6">
                            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-3">
                                Need platform operator access?
                            </p>
                            <Link to="/infra/login" className="inline-flex items-center gap-2 text-xs font-black text-[#0B1F3A] hover:text-[#C8A951] transition-colors group">
                                <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Operator Login
                            </Link>
                        </div>

                        {/* Security Trust Signals */}
                        <div className="mt-12 p-5 bg-[#F8FAFC] rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <BadgeCheck className="w-8 h-8 text-[#C8A951]" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0B1F3A] leading-none mb-1 font-['Inter']">SSL SECURED</p>
                                    <p className="text-[9px] text-text-muted font-black tracking-widest uppercase">256-bit Encrypted Session</p>
                                </div>
                            </div>
                            <img src="https://static.cdnlogo.com/logos/n/80/norton-secured.svg" alt="Norton" className="h-4 opacity-40 grayscale contrast-125" />
                        </div>
                    </motion.div>
                </div>

                {/* INSTITUTIONAL CREDIBILITY FOOTER STRIP */}
                <footer className="bg-surface-main/30 border-t border-edu-border p-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-3 text-[#0B1F3A]">
                            <Building2 className="w-4 h-4 text-[#C8A951]" />
                            <span className="font-black">University Address</span>
                        </div>
                        <p className="leading-relaxed text-text-muted/60">Global Academic Network Nodes<br />Tier-4 Data Center Architecture</p>
                    </div>
                    <div className="flex flex-col space-y-4 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-3 text-[#0B1F3A]">
                            <MailCheck className="w-4 h-4 text-[#C8A951]" />
                            <span className="font-black">Digital Helpdesk</span>
                        </div>
                        <p className="text-text-muted/60">ops@edunexus.systems<br />Infrastructure Status: Operational</p>
                    </div>
                    <div className="flex flex-col space-y-4 text-right">
                        <div className="flex items-center justify-end space-x-3 text-[#0B1F3A]">
                            <Globe className="w-4 h-4 text-[#C8A951]" />
                            <span className="font-black">Legal & Identity</span>
                        </div>
                        <p className="text-text-muted/40">Build Version 4.8.2-GA<br />&copy; 2026 EduNexus Systems Group</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Login;
