import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const ReadingProgressBar = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary origin-left z-[60]"
            style={{ scaleX }}
        />
    );
};

export default ReadingProgressBar;
