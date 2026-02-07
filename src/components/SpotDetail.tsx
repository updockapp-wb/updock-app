import { X, Heart, Wind, Waves, MapPin, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { type Spot } from '../data/spots';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { createPortal } from 'react-dom';
import { Share } from '@capacitor/share';

interface SpotDetailProps {
    spot: Spot | null;
    onClose: () => void;
}

export default function SpotDetail({ spot, onClose }: SpotDetailProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const { t, language } = useLanguage();
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [snap, setSnap] = useState<number | string | null>(0.35);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset state when spot changes
    useEffect(() => {
        if (spot) {
            setIsImageOpen(false);
            setCurrentPhotoIndex(0);
        }
    }, [spot]);

    if (!spot) return null;

    const handleShare = async () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${spot.position[0]},${spot.position[1]}`;
        const title = `Updock - ${spot.name}`;
        const text = `${spot.name} (${spot.type.join(', ')}). ${language === 'fr' && spot.description_fr ? spot.description_fr : spot.description}`;

        try {
            await Share.share({
                title,
                text,
                url,
                dialogTitle: t('spot.share_title') || 'Share this spot',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const content = (
        <div className="flex flex-col h-full bg-white md:rounded-[24px]">
            {/* Header Area */}
            <div className="w-full pt-6 pb-4 px-6 shrink-0">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <motion.h2
                                layoutId={`spot-name-${spot.id}`}
                                className="text-2xl font-bold text-slate-900"
                            >
                                {spot.name}
                            </motion.h2>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${spot.type.includes('Dockstart') ? 'bg-sky-100 text-sky-700' :
                                spot.type.includes('Rockstart') ? 'bg-pink-100 text-pink-700' :
                                    'bg-teal-100 text-teal-700'
                                }`}>
                                {spot.type.join(' • ')}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <MapPin size={14} />
                            <span>{spot.position[0].toFixed(4)}, {spot.position[1].toFixed(4)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare();
                            }}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm"
                            title={t('spot.share')}
                        >
                            <Share2 size={20} className="text-slate-600" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(spot.id);
                            }}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm"
                        >
                            <Heart
                                size={20}
                                className={isFavorite(spot.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}
                            />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Button */}
            <div className="px-6 pb-4">
                <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.position[0]},${spot.position[1]}`, '_blank')}
                    className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <MapPin size={18} />
                    {t('spot.navigate')}
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-12">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-sky-500 mb-1"><Wind size={18} /></div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('spot.difficulty')}</p>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{spot.difficulty}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-teal-500 mb-1"><Waves size={18} /></div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('spot.height')}</p>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{spot.height || '-'}m</p>
                    </div>
                </div>

                {/* Photo Preview */}
                <div className="mb-6">
                    <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                        📷 Photos
                    </h3>
                    <div
                        className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 relative cursor-pointer hover:opacity-90 transition-opacity border border-slate-100"
                        onClick={() => {
                            if (spot.image_urls && spot.image_urls.length > 0) {
                                setCurrentPhotoIndex(0);
                                setIsImageOpen(true);
                            }
                        }}
                    >
                        {spot.image_urls && spot.image_urls.length > 0 ? (
                            <>
                                <img src={spot.image_urls[0]} alt={spot.name} className="w-full h-full object-cover" />
                                {spot.image_urls.length > 1 && (
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">
                                        View {spot.image_urls.length} Photos
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                                <div className="p-3 bg-white rounded-full"><Waves size={24} className="opacity-20" /></div>
                                No photos available
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider opacity-60">{t('spot.desc')}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        {language === 'fr' && spot.description_fr ? spot.description_fr : spot.description}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <div className="hidden md:block absolute left-4 top-4 bottom-4 w-[400px] z-[1050]">
                <motion.div
                    className="h-full rounded-[24px] shadow-2xl overflow-hidden border border-slate-200"
                    initial={{ x: '-105%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-105%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    {content}
                </motion.div>
            </div>

            {/* MOBILE DRAWER (Vaul) */}
            <div className="md:hidden">
                <Drawer.Root
                    open={!!spot}
                    onClose={onClose}
                    snapPoints={[0.35, 0.95]}
                    activeSnapPoint={snap}
                    setActiveSnapPoint={setSnap}
                    shouldScaleBackground
                >
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[2000]" />
                        <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] h-full fixed bottom-0 left-0 right-0 z-[2001] outline-none shadow-2xl">
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mt-3 mb-2" />
                            <div className="flex-1 overflow-hidden">
                                {content}
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            </div>

            {/* Image Gallery Lightbox - Portalled to body to stay on top of everything */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isImageOpen && spot?.image_urls && spot.image_urls.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
                            onClick={() => setIsImageOpen(false)}
                        >
                            <button
                                onClick={() => setIsImageOpen(false)}
                                className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                            >
                                <X size={24} className="text-white" />
                            </button>

                            <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase border border-white/10">
                                {currentPhotoIndex + 1} / {spot.image_urls.length}
                            </div>

                            {spot.image_urls.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : spot.image_urls!.length - 1);
                                        }}
                                        className="absolute left-6 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                                    >
                                        <ChevronLeft size={32} className="text-white" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentPhotoIndex(prev => prev < spot.image_urls!.length - 1 ? prev + 1 : 0);
                                        }}
                                        className="absolute right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                                    >
                                        <ChevronRight size={32} className="text-white" />
                                    </button>
                                </>
                            )}

                            <motion.img
                                key={currentPhotoIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                src={spot.image_urls[currentPhotoIndex]}
                                alt={`${spot.name} - Photo ${currentPhotoIndex + 1}`}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
