import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
    const isMobile = useIsMobile();
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        // Mobile optimization: Always show immediately or with very simple logic
        if (isMobile) {
            setIsVisible(true);
            setHasAnimated(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setIsVisible(true);
                    setHasAnimated(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: "-50px"
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [isMobile, hasAnimated]);

    // Directional transforms
    const getTransform = () => {
        if (isVisible || isMobile) return "translate-0";
        switch (direction) {
            case "up": return "translate-y-8";
            case "down": return "-translate-y-8";
            case "left": return "translate-x-8";
            case "right": return "-translate-x-8";
            default: return "translate-y-8";
        }
    };

    return (
        <div
            ref={ref}
            style={{ width, transitionDelay: `${isMobile ? 0 : delay * 1000}ms` }}
            className={cn(
                "transition-all duration-700 ease-out will-change-[opacity,transform]",
                isVisible || isMobile ? "opacity-100" : "opacity-0",
                getTransform(),
                className
            )}
        >
            {children}
        </div>
    );
};
