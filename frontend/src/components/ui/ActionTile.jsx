import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const ActionTile = ({
    icon: Icon,
    label,
    color = 'bg-surface-main',
    textColor = 'text-primary-500',
    onClick,
    delay = 0
}) => {
    return (
        <button
            onClick={onClick}
            className={`group flex flex-col items-center justify-center p-6 rounded-[2rem] 
                ${color} border border-border-subtle hover:border-primary-500/50 
                hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 relative overflow-hidden focus:ring-4 focus:ring-primary-500/50 outline-none`}
            aria-label={label}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay }}
            >
                <Icon className={`w-6 h-6 ${textColor} mb-3 group-hover:scale-125 transition-transform duration-500`} aria-hidden="true" />
            </motion.div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{label}</span>
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                <ArrowRight className={`w-3 h-3 ${textColor}`} />
            </div>
        </button>
    );
};

export default ActionTile;
