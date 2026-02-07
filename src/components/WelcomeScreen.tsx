import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Waves, CheckCircle2, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
    onClose: () => void;
}

export default function WelcomeScreen({ onClose }: WelcomeScreenProps) {
    const { t } = useLanguage();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-slate-900 flex items-center justify-center p-6 text-center overflow-hidden"
        >
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -right-1/4 w-full h-full bg-sky-500/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -left-1/4 w-full h-full bg-blue-600/20 rounded-full blur-[120px]"
                />
            </div>

            <div className="relative z-10 max-w-sm w-full">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-600 rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-sky-500/40 relative"
                >
                    <Waves size={48} className="text-white" />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg"
                    >
                        <CheckCircle2 size={24} />
                    </motion.div>
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl font-extrabold text-white mb-4 tracking-tight"
                >
                    {t('welcome.title')}
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-400 text-lg mb-12 leading-relaxed"
                >
                    {t('welcome.subtitle')}
                </motion.p>

                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    onClick={onClose}
                    className="group w-full bg-white text-slate-900 font-bold py-5 rounded-2xl shadow-xl hover:bg-sky-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    {t('welcome.btn')}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        </motion.div>
    );
}
