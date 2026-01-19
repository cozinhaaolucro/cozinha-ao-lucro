import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface OnboardingOverlayProps {
    targetId: string;
    message: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    stepName: string;
    onNext?: () => void;
    actionLabel?: string;
    onAction?: () => void;
    backdropClassName?: string;
}

export const OnboardingOverlay = ({ targetId, message, position = 'bottom', stepName, actionLabel, onAction, backdropClassName = "bg-black/50" }: OnboardingOverlayProps) => {
    const { isActive, currentStep, dismissTour, completeTour } = useOnboarding();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const isVisible = isActive && currentStep === stepName;

    useEffect(() => {
        if (!isVisible) return;

        let animationFrameId: number;

        const updateRect = () => {
            const element = document.getElementById(targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(prev => {
                    // Deep compare to avoid re-renders if dimensions haven't changed
                    if (!prev) return rect;
                    if (prev.top !== rect.top || prev.left !== rect.left || prev.width !== rect.width || prev.height !== rect.height) {
                        return rect;
                    }
                    return prev;
                });
            }
            animationFrameId = requestAnimationFrame(updateRect);
        };

        // Initial setup
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            updateRect();
        } else {
            const retryInterval = setInterval(() => {
                const el = document.getElementById(targetId);
                if (el) {
                    clearInterval(retryInterval);
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    updateRect();
                }
            }, 100);
            setTimeout(() => clearInterval(retryInterval), 3000);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isVisible, targetId]);

    if (!isVisible || !targetRect) return null;

    // --- NEW POSITIONING LOGIC (CSS TRANSFORMS) ---
    // Instead of guessing width/height, we anchor to the center/edge of the target 
    // and use translate to shift the balloon into place.
    const GAP = 12; // 12px distance from target

    let styleLeft = 0;
    let styleTop = 0;
    let initialTransform = '';
    let animateTransform = '';
    let exitTransform = '';
    let arrowClass = '';

    // Helper to resolve 'auto'
    let resolvedPosition = position;
    if (position === 'auto') {
        const spaceTop = targetRect.top;
        const spaceBottom = window.innerHeight - targetRect.bottom;
        resolvedPosition = spaceBottom > 200 ? 'bottom' : (spaceTop > 200 ? 'top' : 'bottom');
    }

    switch (resolvedPosition) {
        case 'top':
            // Anchor: Top-Center of target
            // Move: Up (by 100% of balloon height) and Left (by 50% of balloon width)
            styleLeft = targetRect.left + (targetRect.width / 2);
            styleTop = targetRect.top - GAP;
            initialTransform = 'translate(-50%, -95%) scale(0.95)';
            animateTransform = 'translate(-50%, -100%) scale(1)';
            exitTransform = 'translate(-50%, -95%) scale(0.95)';
            arrowClass = "-bottom-2 left-1/2 -translate-x-1/2 border-b border-r"; // Points down
            break;

        case 'bottom':
            // Anchor: Bottom-Center of target
            styleLeft = targetRect.left + (targetRect.width / 2);
            styleTop = targetRect.bottom + GAP;
            initialTransform = 'translate(-50%, -5%) scale(0.95)';
            animateTransform = 'translate(-50%, 0) scale(1)';
            exitTransform = 'translate(-50%, -5%) scale(0.95)';
            arrowClass = "-top-2 left-1/2 -translate-x-1/2 border-t border-l"; // Points up
            break;

        case 'left':
            // Anchor: Left-Center of target
            styleLeft = targetRect.left - GAP;
            styleTop = targetRect.top + (targetRect.height / 2);
            initialTransform = 'translate(-95%, -50%) scale(0.95)';
            animateTransform = 'translate(-100%, -50%) scale(1)';
            exitTransform = 'translate(-95%, -50%) scale(0.95)';
            arrowClass = "top-1/2 -right-2 -translate-y-1/2 border-t border-r"; // Points right
            break;

        case 'right':
            // Anchor: Right-Center of target
            styleLeft = targetRect.right + GAP;
            styleTop = targetRect.top + (targetRect.height / 2);
            initialTransform = 'translate(5%, -50%) scale(0.95)';
            animateTransform = 'translate(0, -50%) scale(1)';
            exitTransform = 'translate(5%, -50%) scale(0.95)';
            arrowClass = "top-1/2 -left-2 -translate-y-1/2 border-b border-l"; // Points left
            break;
    }

    // --- MASK CALCS ---
    const maskPadding = 6; // Comfortable breathing room ("um pouquinho")
    const holeTop = Math.max(0, targetRect.top - maskPadding);
    const holeLeft = Math.max(0, targetRect.left - maskPadding);
    const holeBottom = Math.min(window.innerHeight, targetRect.bottom + maskPadding);
    const holeHeight = holeBottom - holeTop;
    const holeWidth = Math.min(window.innerWidth, targetRect.right + maskPadding) - holeLeft;
    const holeRight = holeLeft + holeWidth;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] pointer-events-none">
                {/* BACKDROP MASKS (Click to Dismiss) - Converted to Motion for synced transitions */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                    onClick={dismissTour} className={cn("absolute pointer-events-auto cursor-pointer", backdropClassName)} style={{ top: 0, left: 0, right: 0, height: holeTop }}
                />
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                    onClick={dismissTour} className={cn("absolute pointer-events-auto cursor-pointer", backdropClassName)} style={{ top: holeBottom, left: 0, right: 0, bottom: 0 }}
                />
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                    onClick={dismissTour} className={cn("absolute pointer-events-auto cursor-pointer", backdropClassName)} style={{ top: holeTop, left: 0, width: holeLeft, height: holeHeight }}
                />
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                    onClick={dismissTour} className={cn("absolute pointer-events-auto cursor-pointer", backdropClassName)} style={{ top: holeTop, left: holeRight, right: 0, height: holeHeight }}
                />

                {/* GLOWING BORDER (Smooth & Professional) */}
                <motion.div
                    className="absolute rounded-lg border-2 border-primary pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0, 1, 0.8], // Fade in then breathe
                        boxShadow: [
                            "0 0 10px 0px hsl(var(--primary) / 0.1)",
                            "0 0 20px 2px hsl(var(--primary) / 0.4)",
                            "0 0 10px 0px hsl(var(--primary) / 0.1)"
                        ]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                        opacity: { duration: 0.3 }, // Fast entry
                        boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" } // Slow breathe
                    }}
                    style={{ top: holeTop, left: holeLeft, width: holeWidth, height: holeHeight }}
                />

                {/* BALLOON CONTAINER */}
                <motion.div
                    initial={{ transform: initialTransform, opacity: 0 }}
                    animate={{ transform: animateTransform, opacity: 1 }}
                    exit={{ transform: exitTransform, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // "Apple-like" smooth easeOut, no bounce
                    style={{
                        position: 'absolute',
                        left: styleLeft,
                        top: styleTop,
                        // transform is handled by motion.div
                    }}
                    className="pointer-events-auto z-[100] w-80 max-w-[90vw]"
                >
                    <div className="relative bg-white dark:bg-card text-foreground p-5 rounded-xl shadow-2xl border border-primary/20 flex flex-col gap-3">
                        {/* ARROW (Part of the card relative container) */}
                        <div className={cn("absolute w-4 h-4 bg-white dark:bg-card transform rotate-45 border-gray-200 dark:border-gray-700 z-10", arrowClass)} />

                        {/* CONTENT */}
                        <div className="flex justify-between items-start z-20 relative">
                            <p className="text-base font-medium leading-relaxed flex-1 pr-8">
                                {message}
                            </p>
                            <button
                                onClick={dismissTour}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-2 -mt-2"
                                title="Fechar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/50 z-20 relative">
                            <button onClick={completeTour} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                                Não mostrar novamente
                            </button>
                            {actionLabel && onAction && (
                                <button onClick={onAction} className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm">
                                    {actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};
