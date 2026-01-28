import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    delay?: number; // delay in ms
    duration?: number; // duration in ms
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

/**
 * FadeIn component for smooth content appearance with optional delay and direction
 */
export function FadeIn({
    children,
    delay = 0,
    duration = 300,
    direction = 'up',
    className,
    style,
    ...props
}: FadeInProps) {
    const directionStyles = {
        up: 'translate-y-2',
        down: '-translate-y-2',
        left: 'translate-x-2',
        right: '-translate-x-2',
        none: '',
    };

    return (
        <div
            className={cn(
                'animate-fade-in opacity-0',
                className
            )}
            style={{
                animationDelay: `${delay}ms`,
                animationDuration: `${duration}ms`,
                animationFillMode: 'forwards',
                ...style,
            }}
            {...props}
        >
            {children}
        </div>
    );
}

interface StaggerContainerProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    staggerDelay?: number; // delay between each child in ms
    initialDelay?: number; // initial delay before first child
}

/**
 * Container that automatically staggers the animation of its children
 */
export function StaggerContainer({
    children,
    staggerDelay = 50,
    initialDelay = 0,
    className,
    ...props
}: StaggerContainerProps) {
    return (
        <div className={className} {...props}>
            {Array.isArray(children)
                ? children.map((child, index) => (
                    <FadeIn key={index} delay={initialDelay + index * staggerDelay}>
                        {child}
                    </FadeIn>
                ))
                : children}
        </div>
    );
}

/**
 * Skeleton loading component for cards
 */
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('animate-pulse rounded-lg bg-muted p-4', className)}>
            <div className="h-4 w-1/3 bg-muted-foreground/20 rounded mb-3" />
            <div className="h-8 w-1/2 bg-muted-foreground/20 rounded" />
        </div>
    );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <div className="flex gap-4 p-4 border-b animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-muted-foreground/20 rounded flex-1"
                    style={{ maxWidth: i === 0 ? '30%' : '20%' }}
                />
            ))}
        </div>
    );
}

/**
 * Section loading wrapper with skeleton fallback
 */
export function SectionLoader({
    loading,
    skeleton,
    children,
    delay = 0,
}: {
    loading: boolean;
    skeleton: ReactNode;
    children: ReactNode;
    delay?: number;
}) {
    if (loading) {
        return <>{skeleton}</>;
    }

    return <FadeIn delay={delay}>{children}</FadeIn>;
}
