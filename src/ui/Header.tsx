import { X } from 'lucide-react';

interface HeaderProps {
    title: string;
    subtitle?: string;
    onClose?: () => void;
    surface?: 'glass' | 'light'; // controls text color: white (glass) vs slate-800 (light)
}

// Master heading component (DS-02). Two rendered heading shapes exposed as shapes,
// class strings extracted verbatim from the existing app:
//   - stacked title(+subtitle) — AuthModal:98-103 (consumed by the 01-06 migration)
//   - row-with-close-button — FiltersModal:38-43
// Heading role is text-2xl font-bold (24px/700). Text color is driven by the
// `surface` prop (white on glass, slate-800 on light) — never hard-coded to one surface.
export default function Header({
    title,
    subtitle,
    onClose,
    surface = 'glass',
}: HeaderProps) {
    const titleColor = surface === 'glass' ? 'text-white' : 'text-slate-800';
    const subtitleColor = surface === 'glass' ? 'text-white/50' : 'text-slate-500';

    if (onClose) {
        // Row-with-close shape (FiltersModal:38-43)
        if (subtitle && import.meta.env.DEV) {
            console.warn('Header: `subtitle` is ignored when `onClose` is provided.');
        }
        return (
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${titleColor}`}>{title}</h2>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                >
                    <X size={20} className="text-slate-600" />
                </button>
            </div>
        );
    }

    // Stacked title+subtitle shape (AuthModal:98-103)
    return (
        <>
            <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>{title}</h2>
            {subtitle && (
                <p className={`${subtitleColor} text-sm mb-8`}>{subtitle}</p>
            )}
        </>
    );
}
