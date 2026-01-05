import { X, Check, Globe, Anchor, Mountain, ArrowDown, Activity, Triangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type StartType } from '../data/spots';
import { useLanguage } from '../context/LanguageContext';

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
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="relative z-10 bg-white w-full max-w-sm sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl pointer-events-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">{t('filters.title')}</h2>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>

                        <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">{t('filters.start_type') || "Start Type"}</p>

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

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl"
                            >
                                {t('filters.show_results')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
