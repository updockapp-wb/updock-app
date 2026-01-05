import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LandingPageProps {
    onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const { t } = useLanguage();

    return (
        <div className="relative w-full h-full bg-slate-900 bg-[url('/landing-bg.png')] bg-cover bg-center flex flex-col justify-end p-6 overflow-hidden">
            {/* Dark Overlay for bottom text legibility */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-md mx-auto mb-8">

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-md">
                        {t('landing.title')}
                    </h1>
                    <p className="text-slate-200 text-base font-medium drop-shadow-sm">
                        {t('landing.subtitle')}
                    </p>
                </motion.div>

                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-sky-900/20 flex items-center justify-center gap-3 transition-colors text-lg border border-sky-400/20 backdrop-blur-sm"
                >
                    <LogIn size={24} />
                    {t('landing.get_started')}
                </motion.button>
            </div>
        </div>
    );
}
