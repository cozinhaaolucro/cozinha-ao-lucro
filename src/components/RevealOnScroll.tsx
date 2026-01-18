import { motion } from "framer-motion";

interface RevealOnScrollProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    className?: string;
    direction?: "up" | "down" | "left" | "right";
}

import { useIsMobile } from "@/hooks/use-mobile";

export const RevealOnScroll = ({
    children,
    width = "100%",
    delay = 0,
    className = "",
    direction = "up"
}: RevealOnScrollProps) => {
    const isMobile = useIsMobile();

    // Optimization: Simplified variants and removed useAnimation hook causing reflows
    // Use native viewport prop which uses IntersectionObserver efficiently

    // Mobile optimization: Reduced distance and simpler easing
    const variants = {
        hidden: {
            opacity: isMobile ? 1 : 0, // Force visible on mobile
            y: isMobile ? 0 : (direction === "up" ? 30 : direction === "down" ? -30 : 0),
            x: isMobile ? 0 : (direction === "left" ? 30 : direction === "right" ? -30 : 0)
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration: 0.6, // Faster for better feel
                delay: isMobile ? 0 : delay, // No delay on mobile
                ease: "easeOut" as const // Simpler math than elastic
            }
        },
    };

    return (
        <div style={{ position: "relative", width }} className={className}>
            <motion.div
                variants={variants}
                initial={isMobile ? "visible" : "hidden"} // Start visible on mobile
                whileInView="visible"
                viewport={{ once: true, margin: "-10%" }} // Trigger slightly before element is fully in view, once only
            >
                {children}
            </motion.div>
        </div>
    );
};
