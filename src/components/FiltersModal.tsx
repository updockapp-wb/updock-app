import { Check, Globe, Anchor, Mountain, ArrowDown, Activity, Triangle, Umbrella } from 'lucide-react';
import { type StartType } from '../data/spots';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../ui/Modal';
import Header from '../ui/Header';

interface FiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFilter: StartType | 'All';
    onFilterChange: (filter: StartType | 'All') => void;
}

export default function FiltersModal({ isOpen, onClose, selectedFilter, onFilterChange }: FiltersModalProps) {
    const { t } = useLanguage();

    const filters = [
        { id: 'All', label: t('filters.all'), icon: <Globe size={20} /> },
        { id: 'Dockstart', label: 'Dockstart', icon: <Anchor size={20} /> },
        { id: 'Rockstart', label: 'Rockstart', icon: <Mountain size={20} /> },
        { id: 'Dropstart', label: 'Dropstart', icon: <ArrowDown size={20} /> },
        { id: 'Deadstart', label: 'Deadstart', icon: <Activity size={20} /> },
        { id: 'Rampstart', label: 'Rampstart', icon: <Triangle size={20} /> },
        { id: 'Beachstart', label: 'Beachstart', icon: <Umbrella size={20} /> },
    ];

    // Shell + header now come from the design system masters (DS-02). The light/sheet
    // Modal shape and Header's row-with-close shape were both extracted verbatim from
    // this file, so the render is byte-identical to the previous inline markup.
    return (
        <Modal isOpen={isOpen} onClose={onClose} surface="light" layout="sheet">
            <Header surface="light" title={t('filters.title')} onClose={onClose} />

            <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">{t('filters.start_type') || "Start Type"}</p>

            {/* Filter rows stay custom: no src/ui/Button variant matches this shape
                (border-2 selected state + icon chip + check pill). */}
            <div className="space-y-3">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => onFilterChange(f.id as any)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all
                            ${selectedFilter === f.id
                                ? 'border-sky-500 bg-sky-50'
                                : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selectedFilter === f.id ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                                {f.icon}
                            </div>
                            <span className={`font-bold ${selectedFilter === f.id ? 'text-sky-700' : 'text-slate-600'}`}>
                                {f.label}
                            </span>
                        </div>
                        {selectedFilter === f.id && (
                            <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                                <Check size={14} className="text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* CTA stays custom: Button variants are primary(sky)/secondary(slate-200)/
                ghost/danger(rose) — none matches bg-slate-900. */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl"
                >
                    {t('filters.show_results')}
                </button>
            </div>
        </Modal>
    );
}
