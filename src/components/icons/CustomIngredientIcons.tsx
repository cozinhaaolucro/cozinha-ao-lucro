
import React from 'react';

// Common props
interface IconProps extends React.SVGProps<SVGSVGElement> { }

export const IconCondensedMilk = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Can shape */}
        <path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2" />
        <path d="M20 6v12c0 1.1-3.6 2-8 2s-8-.9-8-2V6" />
        <path d="M4 12c0 1.1 3.6 2 8 2s8-.9 8-2" opacity="0.5" />
        {/* Drop */}
        <path d="M12 2C12 2 15 4 15 6" className="text-yellow-500 fill-yellow-500/20" />
        <text x="12" y="16" fontSize="5" textAnchor="middle" fill="currentColor" fontFamily="sans-serif" fontWeight="bold">LC</text>
    </svg>
);

export const IconMilkCarton = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M7 21h10a2 2 0 0 0 2-2V9.4L12 3 5 9.4V19a2 2 0 0 0 2 2z" />
        <path d="M12 3v6.4l7 6.6" />
        <text x="12" y="18" fontSize="4" textAnchor="middle" fill="currentColor">LEITE</text>
    </svg>
);

export const IconCreamBox = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Tetra pak brick */}
        <rect x="5" y="6" width="14" height="16" rx="1" />
        <path d="M5 10h14" />
        <path d="M9 2h6l2 4H7l2-4z" />
        <text x="12" y="19" fontSize="4" textAnchor="middle" fill="currentColor">CREME</text>
    </svg>
);

export const IconNutellaJar = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Jar Body */}
        <path d="M6 8c0 0-1 9 2 11h8c3 0 2-11 2-11" />
        {/* Lid */}
        <rect x="5" y="3" width="14" height="5" rx="1" fill="currentColor" fillOpacity="0.1" />
        <text x="12" y="15" fontSize="3" textAnchor="middle" fill="currentColor" fontWeight="bold">NUTELA</text>
    </svg>
);

export const IconFlourSack = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Sack shape */}
        <path d="M5 21s-1-6 2-11 3-5 5-5 2 1 5 5 2 11 2 11H5z" />
        <path d="M8 8h8" />
        <text x="12" y="16" fontSize="4" textAnchor="middle" fill="currentColor">TRIGO</text>
    </svg>
);

export const IconSugar = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Bag/Sack */}
        <rect x="5" y="6" width="14" height="15" rx="2" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <circle cx="10" cy="14" r="0.5" fill="currentColor" />
        <circle cx="14" cy="12" r="0.5" fill="currentColor" />
        <circle cx="13" cy="16" r="0.5" fill="currentColor" />
        <text x="12" y="11" fontSize="3" textAnchor="middle" fill="currentColor">AÇÚCAR</text>
    </svg>
);

export const IconButter = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* 3D Block */}
        <path d="M4 14l6-3 10 3v5l-10 3-6-3v-5z" />
        <path d="M4 14l-2-6 10-3 10 3-2 6" />
        <path d="M10 11v-3" />
        <text x="15" y="18" fontSize="3" textAnchor="middle" fill="currentColor">MANT.</text>
    </svg>
);

export const IconChocolateBar = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Bar */}
        <rect x="4" y="4" width="16" height="16" rx="1" />
        {/* Grid */}
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <rect x="6" y="6" width="4" height="4" rx="0.5" fill="currentColor" fillOpacity="0.1" />
    </svg>
);

export const IconPowder = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Pouch */}
        <path d="M19 5h-4l-2-3-2 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z" />
        <circle cx="12" cy="14" r="3" />
        <text x="12" y="15" fontSize="3" textAnchor="middle" fill="currentColor">PÓ</text>
    </svg>
);

export const IconEgg = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-9-13-9-13S3 8.03 3 13c0 4.97 4.03 9 9 9z" />
        <path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" opacity="0.3" />
    </svg>
);

export const IconChantilly = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Can + Nozzle */}
        <rect x="7" y="10" width="10" height="12" rx="1" />
        <path d="M12 10V6" />
        <path d="M10 6h4l-2-4-2 4z" />
        <text x="12" y="18" fontSize="3" textAnchor="middle" fill="currentColor">TOP</text>
    </svg>
);

export const IconPackaging = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        <path d="M12 3v9" />
        <path d="M12 12l8-4.5" />
        <path d="M12 12l-8-4.5" />
    </svg>
);
