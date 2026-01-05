import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
    const { t } = useLanguage();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mt-2">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                                <Sparkles size={32} className="text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('premium.title')}</h2>

                            <p className="text-slate-500 mb-8 leading-relaxed">
                                {t('premium.desc')}
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-all"
                            >
                                {t('premium.btn')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
