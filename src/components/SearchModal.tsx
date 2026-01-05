import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, ChevronRight } from 'lucide-react';
import { useSpots } from '../context/SpotsContext';
import { useLanguage } from '../context/LanguageContext';
import { type Spot } from '../data/spots';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSpotSelect: (spot: Spot) => void;
}

export default function SearchModal({ isOpen, onClose, onSpotSelect }: SearchModalProps) {
    const { spots } = useSpots();
    const { t } = useLanguage();
    const [query, setQuery] = useState('');

    const filteredSpots = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return spots.filter(spot =>
            spot.name.toLowerCase().includes(lowerQuery) ||
            spot.description.toLowerCase().includes(lowerQuery) ||
            spot.type.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }, [spots, query]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[5000] flex items-start justify-center pt-4 sm:pt-20 px-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                    >
                        {/* Search Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white z-10">
                            <Search className="text-slate-400" size={20} />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('search.placeholder') || "Search spots..."}
                                className="flex-1 text-lg outline-none placeholder:text-slate-300 text-slate-700 font-medium"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="p-1 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600">
                                <span className="text-sm font-bold">Cancel</span>
                            </button>
                        </div>

                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 p-2">
                            {query.trim() === '' ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-medium">Type to find spots nearby</p>
                                </div>
                            ) : filteredSpots.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <p>No spots found regarding "{query}"</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredSpots.map(spot => (
                                        <button
                                            key={spot.id}
                                            onClick={() => onSpotSelect(spot)}
                                            className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-sky-100 transition-all flex items-center gap-4 text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 truncate">{spot.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 rounded">{spot.type.join(' • ')}</span>
                                                    <span className="text-xs text-slate-400 truncate max-w-[150px]">{spot.description}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
