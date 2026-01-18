import { motion } from "framer-motion";

interface RevealOnScrollProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    className?: string;
    direction?: "up" | "down" | "left" | "right";
}

export const RevealOnScroll = ({
    children,
    width = "100%",
    delay = 0,
    className = "",
    direction = "up"
}: RevealOnScrollProps) => {
    // Optimization: Simplified variants and removed useAnimation hook causing reflows
    // Use native viewport prop which uses IntersectionObserver efficiently

    // Mobile optimization: Reduced distance and simpler easing
    const variants = {
        hidden: {
            opacity: 0,
            y: direction === "up" ? 30 : direction === "down" ? -30 : 0,
            x: direction === "left" ? 30 : direction === "right" ? -30 : 0
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration: 0.6, // Faster for better feel
                delay: delay,
                ease: "easeOut" // Simpler math than elastic
            }
        },
    };

    return (
        <div style={{ position: "relative", width }} className={className}>
            <motion.div
                variants={variants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-10%" }} // Trigger slightly before element is fully in view, once only
            >
                {children}
            </motion.div>
        </div>
    );
};
