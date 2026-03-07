import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ClipboardCheck,
    BarChart3,
    Users,
    Settings,
    MessageSquare,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    Search,
    Bell,
    ChevronRight,
    Sun,
    Moon
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Faculty', 'Student'] },
    { label: 'Attendance', path: '/attendance', icon: ClipboardCheck, roles: ['Admin', 'Faculty', 'Student'] },
    { label: 'Marks', path: '/marks', icon: BarChart3, roles: ['Admin', 'Faculty', 'Student'] },
    { label: 'Users', path: '/users', icon: Users, roles: ['Admin', 'Super Admin'] },
    { label: 'Admin Panel', path: '/admin', icon: Settings, roles: ['Super Admin'] },
    { label: 'Beta Feedback', path: '/beta-feedback', icon: MessageSquare, roles: ['Admin', 'Super Admin'] },
];

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDark]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleTheme = () => setIsDark(!isDark);

    const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

    const sidebarTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

    return (
        <div className={`min-h-screen bg-surface-main flex overflow-hidden font-sans ${isDark ? 'dark' : ''}`}>
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 100 : 280 }}
                transition={sidebarTransition}
                role="navigation"
                aria-label="Main Navigation"
                className={`fixed inset-y-0 left-0 z-50 bg-surface-card backdrop-blur-xl border-r border-border-subtle 
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col`}
            >
                <div className="flex items-center justify-between h-24 px-8 mb-4">
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center space-x-3"
                            >
                                <div className="w-10 h-10 bg-text-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/10">
                                    <img src={BRAND_CONFIG.logoPath} alt="" aria-hidden="true" className="w-6 h-6 object-contain invert dark:invert-0" />
                                </div>
                                <span className="font-black text-xl tracking-tight text-text-primary">EduNexus</span>
                            </motion.div>
                        )}
                        {isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mx-auto"
                            >
                                <div className="w-12 h-12 bg-text-primary rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-primary-500/10">
                                    <img src={BRAND_CONFIG.logoPath} alt="" aria-hidden="true" className="w-7 h-7 object-contain invert dark:invert-0" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(true)}
                            aria-label="Collapse sidebar"
                            className="hidden lg:flex p-2 text-text-muted hover:text-text-primary hover:bg-surface-main rounded-xl transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        aria-label="Expand sidebar"
                        className="hidden lg:flex absolute -right-4 top-10 w-8 h-8 bg-surface-card border border-border-subtle rounded-full items-center justify-center shadow-premium text-text-muted hover:text-text-primary z-50 transition-all focus:ring-4 focus:ring-primary-500/50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {visibleNav.map((item) => {
                        const active = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                title={isCollapsed ? item.label : ''}
                                to={item.path}
                                aria-current={active ? 'page' : undefined}
                                className={`group flex items-center ${isCollapsed ? 'justify-center px-4' : 'px-6'} py-4 rounded-2xl transition-all duration-300 relative
                                    ${active ? 'bg-text-primary text-surface-main shadow-2xl shadow-primary-500/5' : 'text-text-secondary hover:bg-surface-main hover:text-text-primary'}`}
                            >
                                <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? '' : 'group-hover:scale-110'}`} aria-hidden="true" />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="ml-4 font-bold tracking-tight"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                                {active && !isCollapsed && (
                                    <motion.div
                                        layoutId="activePill"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className={`p-4 space-y-4 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        className={`flex items-center justify-center ${isCollapsed ? 'w-12 h-12' : 'w-full py-3 px-6'} rounded-2xl bg-surface-main border border-border-subtle transition-all hover:border-primary-500/50 group`}
                    >
                        {isDark ? (
                            <>
                                <Sun className="w-5 h-5 text-yellow-500 transition-transform group-hover:rotate-45" />
                                {!isCollapsed && <span className="ml-3 text-xs font-bold text-text-primary">Light Mode</span>}
                            </>
                        ) : (
                            <>
                                <Moon className="w-5 h-5 text-indigo-500 transition-transform group-hover:-rotate-12" />
                                {!isCollapsed && <span className="ml-3 text-xs font-bold text-text-primary">Dark Mode</span>}
                            </>
                        )}
                    </button>

                    <div className={`relative p-4 rounded-[2rem] bg-surface-main border border-border-subtle transition-all duration-500 ${isCollapsed ? 'w-16 h-16 p-0 flex items-center justify-center' : 'w-full'}`}>
                        <div className="flex items-center space-x-3">
                            <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl bg-surface-card border border-border-subtle shadow-sm flex items-center justify-center text-text-primary font-black text-sm transition-all duration-500 ${isCollapsed ? 'mx-auto' : ''}`}>
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-surface-main rounded-full" aria-label="Online"></div>
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-text-primary truncate tracking-tight">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mt-1">{user?.role}</p>
                                </div>
                            )}
                        </div>

                        {!isCollapsed && (
                            <button
                                onClick={handleLogout}
                                aria-label="Log out"
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* Header */}
                <header
                    role="banner"
                    className={`h-20 flex items-center justify-between px-8 bg-surface-main/80 backdrop-blur-md z-30 transition-shadow ${scrolled ? 'shadow-sm border-b border-border-subtle' : ''}`}
                >
                    <div className="flex items-center flex-1 max-w-xl">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors group-focus-within:text-text-primary" aria-hidden="true" />
                            <input
                                type="text"
                                aria-label="Search dashboard"
                                placeholder="Search everything..."
                                className="w-full pl-12 pr-4 py-2.5 bg-surface-card/50 border border-border-subtle rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all text-sm font-medium text-text-primary"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            aria-label="View notifications"
                            className="relative p-2.5 text-text-secondary hover:bg-surface-card rounded-2xl transition-all border border-transparent hover:border-border-subtle group hover:shadow-premium"
                        >
                            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 border-2 border-surface-main rounded-full animate-pulse"></span>
                        </button>
                        <div className="w-px h-6 bg-border-subtle mx-2" aria-hidden="true"></div>
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-xs font-black text-text-primary leading-none">Status</span>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1">Live Beta</span>
                        </div>
                    </div>
                </header>

                <main role="main" className="flex-1 p-8 md:p-12 overflow-y-auto overflow-x-hidden scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav
                aria-label="Mobile Navigation"
                className="lg:hidden fixed bottom-6 left-6 right-6 h-20 glass rounded-[2.5rem] flex items-center justify-around px-4 shadow-2xl z-50"
            >
                {visibleNav.slice(0, 4).map((item) => {
                    const active = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            aria-current={active ? 'page' : undefined}
                            aria-label={item.label}
                            className={`p-4 rounded-2xl transition-all ${active ? 'bg-text-primary text-surface-main shadow-xl shadow-primary-500/10 scale-110' : 'text-text-muted'}`}
                        >
                            <Icon className="w-6 h-6" />
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
