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

// Master modal shell (DS-02). Two rendered shell shapes exposed as shapes, class strings
// extracted verbatim from the existing app:
//   - glass + center — the original Modal shell (consumed by AuthModal:84)
//   - light + sheet  — FiltersModal:29-37 (bottom sheet; its close button lives in the
//                      child <Header surface="light" onClose>, so no built-in close here)
// `surface` defaults to 'glass' and `layout` to 'center': existing consumers (AuthModal,
// the sole one — see 02-BASELINE.md § 1) render byte-identically without any prop change.
export default function Modal({
    isOpen,
    onClose,
    children,
    surface = 'glass',
    layout = 'center',
}: ModalProps) {
    // The two shapes are shipped as pairs; a mixed pair (e.g. glass + sheet) has no
    // verbatim source in the app, so it is not a supported appearance (DS principle:
    // variants widen the API, never invent an appearance).
    const isLightSheet = surface === 'light' || layout === 'sheet';

    if (isLightSheet) {
        if (import.meta.env.DEV && (surface !== 'light' || layout !== 'sheet')) {
            console.warn(
                'Modal: `surface="light"` and `layout="sheet"` are only supported together; rendering the light bottom-sheet shape.'
            );
        }

        // Light bottom-sheet shape (FiltersModal:29-37, verbatim)
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
