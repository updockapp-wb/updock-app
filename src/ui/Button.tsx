import { Loader2 } from 'lucide-react';

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    iconOnly?: boolean;
    'aria-label'?: string;
    type?: 'button' | 'submit';
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    children?: React.ReactNode;
}

// Verbatim variant signatures extracted from existing app usage (D-06):
// variants widen the API, never the appearance. No styles invented here.
const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    // AuthModal:200 — the sole visual anchor (sky-500 accent + glow)
    primary: 'bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]',
    // Profile:431
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-2xl transition-all',
    // AuthModal:93 (icon-only close button)
    ghost: 'bg-white/5 hover:bg-white/10 rounded-full transition-colors',
    // AdminDashboard:439
    danger: 'bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors',
};

// Size rung = vertical padding, from existing usage.
const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'py-2',
    md: 'py-3',
    lg: 'py-4',
};

export default function Button({
    variant = 'primary',
    size = 'lg',
    loading = false,
    disabled = false,
    iconOnly = false,
    'aria-label': ariaLabel,
    type = 'button',
    onClick,
    className = '',
    children,
}: ButtonProps) {
    // A11y contract (UI-SPEC): icon-only controls carry no visible text and MUST
    // supply an accessible label. Enforced, not merely typed.
    if (iconOnly && !ariaLabel) {
        console.error('Button: icon-only variant requires an `aria-label` for accessibility.');
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading || disabled}
            aria-label={ariaLabel}
            className={`${variantClasses[variant]} ${sizeClasses[size]} flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none ${className}`}
        >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {children}
        </button>
    );
}
