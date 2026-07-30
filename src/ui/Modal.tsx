import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    surface?: 'glass' | 'light'; // panel surface: translucent glass card vs opaque white sheet
    layout?: 'center' | 'sheet'; // panel placement: centered dialog vs bottom sheet (slide-y)
}

// Master modal shell (DS-02). Three rendered shell shapes exposed as shapes, class strings
// extracted verbatim from the existing app:
//   - light + center — the opaque white centered dialog (PremiumModal.tsx:16-30; animated
//                      fade backdrop + scale/y panel; its close button is a floating absolute
//                      child that leans on the panel's `relative`, so no built-in close here)
//   - light + sheet  — FiltersModal:29-37 (bottom sheet; its close button lives in the
//                      child <Header surface="light" onClose>, so no built-in close here)
//   - glass + center — the original Modal shell (consumed by AuthModal:84)
// `surface` defaults to 'glass' and `layout` to 'center': existing consumers (AuthModal,
// FiltersModal — see 02/03-BASELINE.md § 1) render byte-identically without any prop change.
export default function Modal({
    isOpen,
    onClose,
    children,
    surface = 'glass',
    layout = 'center',
}: ModalProps) {
    // The shapes ship as pairs. The supported appearances are light+center, light+sheet and
    // glass+center; the mixed pair glass+sheet has no verbatim source in the app, so it is
    // not a supported appearance (DS principle: variants widen the API, never invent one).

    // Light centered shape (PremiumModal.tsx:16-30, verbatim) — evaluated FIRST so that
    // light+center never falls through to the bottom-sheet branch below.
    if (surface === 'light' && layout === 'center') {
        return (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
                        >
                            {children}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    // Light bottom-sheet shape (FiltersModal:29-37, verbatim). Reached by light+sheet,
    // glass+sheet and light-only. glass+sheet has no verbatim source and stays unsupported.
    const isLightSheet = surface === 'light' || layout === 'sheet';

    if (isLightSheet) {
        if (import.meta.env.DEV && surface === 'glass' && layout === 'sheet') {
            console.warn(
                'Modal: the supported pairs are `glass`+`center`, `light`+`sheet` and `light`+`center`; `glass`+`sheet` has no verbatim source and is not supported — rendering the light bottom-sheet shape.'
            );
        }

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
                            {children}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    // Glass centered shape (original shell — default, keeps AuthModal unchanged)
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
