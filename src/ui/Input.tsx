import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps {
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    icon?: LucideIcon;
    type?: string;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    surface?: 'glass' | 'light'; // controls field/label appearance: dark glass (default) vs light sheet
    multiline?: boolean; // render a <textarea> instead of <input>
    maxLength?: number; // UX client-side guard (NOT a security boundary — RLS/Postgres is authoritative)
    error?: string; // inline validation message rendered below the field (light surface)
}

// Master input primitive (DS-02). The default `surface='glass'` render is byte-identical to the
// original AuthModal fields (dark translucent field + uppercase white label — see 01-BASELINE).
// The `light` surface reproduces AddSpotForm's fields verbatim (bg-slate-50 border-2 border-slate-100).
// Class strings are extracted verbatim from the existing app — never invented (Pitfall 2: changing the
// glass default would regress AuthModal).
export default function Input({
    label,
    value,
    onChange,
    icon: Icon,
    type = 'text',
    placeholder,
    required,
    minLength,
    surface = 'glass',
    multiline,
    maxLength,
    error,
}: InputProps) {
    const inputId = useId();
    const isLight = surface === 'light';

    // Label: light = normalized font-normal (UI-SPEC Typography § graisses), never uppercase glass.
    const labelClass = isLight
        ? 'block text-sm font-normal text-slate-700 mb-2'
        : 'text-xs font-bold text-white/70 uppercase tracking-wider ml-1';

    // Field: light extracted verbatim from AddSpotForm L206 (input) / L218 (textarea min-h-[100px]).
    // Glass extracted verbatim from the original Input (bg-black/20 ... focus:ring-primary).
    const fieldClass = isLight
        ? `w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none transition-colors${multiline ? ' min-h-[100px]' : ''}`
        : `w-full bg-black/20 border border-white/10 rounded-xl py-3 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all`;

    return (
        <div className="space-y-2">
            <label htmlFor={inputId} className={labelClass}>{label}</label>
            <div className="relative">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />}
                {multiline ? (
                    <textarea
                        id={inputId}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        minLength={minLength}
                        maxLength={maxLength}
                        className={fieldClass}
                    />
                ) : (
                    <input
                        id={inputId}
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        minLength={minLength}
                        maxLength={maxLength}
                        className={fieldClass}
                    />
                )}
            </div>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{error}</div>
            )}
        </div>
    );
}
