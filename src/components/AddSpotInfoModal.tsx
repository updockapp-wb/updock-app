import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddSpotInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

export default function AddSpotInfoModal({ isOpen, onClose, onContinue }: AddSpotInfoModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1c1c1e] text-white w-full max-w-sm rounded-[32px] p-8 relative shadow-2xl overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X size={20} className="text-white/70" />
                        </button>

                        <h2 className="text-2xl font-bold mb-6">Adding a new spot</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-lg mb-1">Zoom in</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    Get the most accurate location.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-1">Tap on the map</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    A green marker will pinpoint your chosen spot location.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-1">Visibility</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    Newly added spots will initially be visible only to you.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-1">Images</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    Please only use original images for each spot, avoid downloading or using others' photos.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-1">Review</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    Admins will check out your spot and review it for the community.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onContinue}
                            className="w-full mt-8 bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                        >
                            Continue
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
