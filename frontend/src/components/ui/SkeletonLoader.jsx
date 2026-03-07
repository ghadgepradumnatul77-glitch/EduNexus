import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'card', className = '' }) => {
    const variants = {
        card: "h-64",
        metric: "h-48",
        text: "h-4 w-3/4",
        title: "h-8 w-1/2",
        avatar: "h-12 w-12 rounded-full",
        chart: "h-[450px]"
    };

    return (
        <div className={`skeleton ${variants[type] || ''} ${className}`} aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-effect"></div>
        </div>
    );
};

export default SkeletonLoader;
