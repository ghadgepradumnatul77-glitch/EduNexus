import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    data = [],
    color = '#14b8a6',
    loading = false,
    delay = 0
}) => {
    const isNegative = trend === 'down' || (typeof trendValue === 'string' && trendValue.includes('-'));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.2, 0, 0, 1] }}
            whileHover={{ translateY: -8 }}
            className="card-premium group cursor-default relative overflow-hidden flex flex-col h-full"
            role="article"
            aria-label={`${title} metric: ${value}`}
        >
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${color}10`, color: color }}
                        aria-hidden="true"
                    >
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{title}</span>
                        <div
                            className="flex items-center space-x-1 text-[10px] font-black"
                            style={{ color: isNegative ? '#ef4444' : color }}
                        >
                            {isNegative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            <span>{trendValue}</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="h-10 w-24 skeleton mt-2"></div>
                ) : (
                    <div className="flex flex-col">
                        <p className="text-3xl font-black text-text-primary tracking-tight mb-1">{value}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Current Status</p>
                    </div>
                )}

                <div className="h-12 w-full mt-6">
                    {!loading && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.map((v, i) => ({ v, i }))}>
                                <Line
                                    type="monotone"
                                    dataKey="v"
                                    stroke={color}
                                    strokeWidth={3}
                                    dot={false}
                                    animationDuration={250}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full bg-surface-main/50 rounded-lg flex items-center justify-center">
                            <div className="w-full h-[2px] bg-border-subtle"></div>
                        </div>
                    )}
                </div>
            </div>
            {/* Background Accent */}
            <div
                className="absolute -bottom-10 -right-10 w-32 h-32 opacity-[0.03] dark:opacity-[0.08] rounded-full transition-transform duration-700 group-hover:scale-150"
                style={{ backgroundColor: color }}
                aria-hidden="true"
            ></div>
        </motion.div>
    );
};

export default MetricCard;
