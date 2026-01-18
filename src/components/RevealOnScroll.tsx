import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Shared Observer Manager (Singleton Pattern)
// Saves memory and processing time by using one observer for all elements
const observerMap = new Map<Element, (entry: IntersectionObserverEntry) => void>();
let sharedObserver: IntersectionObserver | null = null;

const getObserver = () => {
    if (!sharedObserver) {
        sharedObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const callback = observerMap.get(entry.target);
                if (callback && entry.isIntersecting) {
                    callback(entry);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "-50px"
        });
    }
    return sharedObserver;
};

const observe = (element: Element, callback: (entry: IntersectionObserverEntry) => void) => {
    observerMap.set(element, callback);
    getObserver().observe(element);
};

const unobserve = (element: Element) => {
    observerMap.delete(element);
    if (sharedObserver) {
        sharedObserver.unobserve(element);
    }
};

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
    // Optimization: Initialize state directly to avoid re-render effect
    const [isVisible, setIsVisible] = useState(!!isMobile);
    const [hasAnimated, setHasAnimated] = useState(!!isMobile);

    useEffect(() => {
        // Mobile optimization: Always show immediately
        if (isMobile) {
            if (!isVisible) setIsVisible(true);
            if (!hasAnimated) setHasAnimated(true);
            return;
        }

        const currentRef = ref.current;
        if (!currentRef) return;

        // Defer registration to unblock main thread during hydration
        // This pushes TBT down significantly
        const registerOnIdle = () => {
            const requestIdleCallback = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 1));
            const cancelIdleCallback = (window as any).cancelIdleCallback || clearTimeout;

            const handle = requestIdleCallback(() => {
                // Register with shared observer
                observe(currentRef, () => {
                    if (!hasAnimated) {
                        setIsVisible(true);
                        setHasAnimated(true);
                        // Cleanup self from observer once animated
                        unobserve(currentRef);
                    }
                });
            });

            return () => cancelIdleCallback(handle);
        };

        const cancelRegistration = registerOnIdle();

        return () => {
            cancelRegistration();
            if (currentRef) {
                unobserve(currentRef);
            }
        };
    }, [isMobile, hasAnimated]); // Dependencies remain the same

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
