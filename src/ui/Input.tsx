import type { LucideIcon } from 'lucide-react';

interface InputProps {
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    icon?: LucideIcon;
    type?: string;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
}

export default function Input({
    label,
    value,
    onChange,
    icon: Icon,
    type = 'text',
    placeholder,
    required,
    minLength,
}: InputProps) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                    className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                />
            </div>
        </div>
    );
}
