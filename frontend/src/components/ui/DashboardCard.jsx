import { motion } from 'framer-motion';

const DashboardCard = ({
    children,
    className = '',
    onClick,
    interactive = false,
    delay = 0,
    ...props
}) => {
    const isClickable = interactive || !!onClick;

    const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                delay,
                ease: [0.2, 0, 0, 1]
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            whileHover={isClickable ? { translateY: -8, scale: 1.01 } : {}}
            whileTap={isClickable ? { scale: 0.98 } : {}}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={onClick}
            onKeyDown={isClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            } : undefined}
            className={`card-premium ${isClickable ? 'cursor-pointer focus-within:ring-4 focus-within:ring-primary-500/50' : 'cursor-default'} ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default DashboardCard;
