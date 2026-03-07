import { motion } from 'framer-motion';

const GlassPanel = ({ children, className = '', ...props }) => {
    return (
        <motion.div
            className={`glass rounded-3xl p-6 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default GlassPanel;
