import { X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../ui/Modal';
import Header from '../ui/Header';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
    const { t } = useLanguage();

    return (
        <Modal isOpen={isOpen} onClose={onClose} surface="light" layout="center">
            <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-muted hover:bg-slate-200 transition-colors"
            >
                <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                    <Sparkles size={32} className="text-white" />
                </div>

                <Header surface="light" title={t('premium.title')} />

                <p className="text-muted mb-8 leading-relaxed">
                    {t('premium.desc')}
                </p>

                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-secondary text-white font-bold rounded-xl active:scale-95 transition-all"
                >
                    {t('premium.btn')}
                </button>
            </div>
        </Modal>
    );
}
