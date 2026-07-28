import { type ReactNode } from 'react';

interface CardProps {
    variant?: 'glass' | 'light';
    interactive?: boolean;
    className?: string;
    children: ReactNode;
}

// Master surface component (DS-02). Distinct rendered card surfaces are exposed as
// VARIANTS, class strings extracted verbatim from the existing app surfaces:
//   - glass (NearbySpotsList): 32px radius consumed via the rounded-4xl token
//     (plan 01-03 --radius-4xl: 2rem, identical 32px) instead of the off-scale literal.
//   - light resting (Profile) + interactive hover-elevation (AdminDashboard).
// Distinct radii (glass rounded-4xl vs light rounded-2xl) are intentionally NOT unified.
export default function Card({
    variant = 'light',
    interactive = false,
    className,
    children,
}: CardProps) {
    const variantClasses =
        variant === 'glass'
            ? 'bg-white/95 backdrop-blur-md rounded-4xl p-6 shadow-xl border border-white/20'
            : 'bg-white p-4 rounded-2xl border border-slate-100 shadow-sm';

    const interactiveClasses =
        interactive && variant === 'light'
            ? 'cursor-pointer hover:border-sky-300 hover:shadow-md transition-all'
            : '';

    const classes = [variantClasses, interactiveClasses, className]
        .filter(Boolean)
        .join(' ');

    return <div className={classes}>{children}</div>;
}
