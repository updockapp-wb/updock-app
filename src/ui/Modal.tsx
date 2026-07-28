import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-sm rounded-4xl p-8 shadow-2xl relative overflow-hidden"
                    >
                        {/* Close Button */}
                        <Button variant="ghost" iconOnly aria-label="Close" onClick={onClose} className="absolute top-4 right-4 !p-2">
                            <X size={20} className="text-white/70" />
                        </Button>

                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
