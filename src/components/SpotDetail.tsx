import { X, Heart, Wind, Waves, MapPin, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { type Spot } from '../data/spots';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

interface SpotDetailProps {
    spot: Spot | null;
    onClose: () => void;
}

export default function SpotDetail({ spot, onClose }: SpotDetailProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const { t, language } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Reset expanded state when spot changes
    useEffect(() => {
        if (spot) {
            setIsExpanded(false);
            setIsImageOpen(false);
        }
    }, [spot]);

    if (!spot) return null;

    return (
        <AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 md:inset-0 z-[1050] pointer-events-none flex flex-col justify-end md:block">
                <motion.div
                    key={spot.id}
                    className="
                        bg-white shadow-2xl overflow-hidden flex flex-col pointer-events-auto
                        w-full max-w-md mx-auto
                        fixed md:absolute 
                        bottom-0 inset-x-0 
                        md:left-4 md:top-4 md:bottom-4 md:right-auto md:w-[400px] md:h-auto md:rounded-[24px] rounded-t-[32px] md:m-0 z-[1050]
                    "
                    initial={{ y: '100%', x: 0 }}
                    animate={{
                        y: window.innerWidth >= 768 ? 0 : (isExpanded ? 0 : '78%'),
                        x: 0
                    }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                >
                    {/* Header Area */}
                    <div
                        className="w-full pt-8 pb-4 px-6 bg-white shrink-0 cursor-pointer md:cursor-default hover:bg-slate-50 md:hover:bg-white transition-colors"
                        onClick={() => window.innerWidth < 768 && setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-slate-900">{spot.name}</h2>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${spot.type.includes('Dockstart') ? 'bg-sky-100 text-sky-700' :
                                        spot.type.includes('Rockstart') ? 'bg-pink-100 text-pink-700' :
                                            'bg-teal-100 text-teal-700'
                                        }`}>
                                        {spot.type.join(' • ')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <MapPin size={16} />
                                    <span>{spot.position[0].toFixed(4)}, {spot.position[1].toFixed(4)}</span>
                                </div>
                            </div>

                            {/* Favorite & Close Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(spot.id);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                >
                                    <Heart
                                        size={20}
                                        className={isFavorite(spot.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}
                                    />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Chevron Indicator (Mobile Only) */}
                        <div className="flex justify-center md:hidden">
                            {isExpanded ? (
                                <ChevronDown size={20} className="text-slate-400" />
                            ) : (
                                <ChevronUp size={20} className="text-slate-400" />
                            )}
                        </div>
                    </div>

                    {/* Navigation Button */}
                    <div className="px-6 pb-4">
                        <button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.position[0]},${spot.position[1]}`, '_blank')}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <MapPin size={18} />
                            {t('spot.navigate')}
                        </button>
                    </div>

                    {/* Scrollable Expanded Content */}
                    <motion.div
                        className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 pt-2"
                        animate={{ opacity: window.innerWidth >= 768 ? 1 : (isExpanded ? 1 : 0) }}
                        transition={{ duration: 0.2 }}
                        style={{ pointerEvents: window.innerWidth >= 768 ? 'auto' : (isExpanded ? 'auto' : 'none') }}
                    >
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-slate-100">
                                <div className="text-sky-500 mb-2"><Wind size={20} /></div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('spot.difficulty')}</span>
                                <span className="font-bold text-slate-800 text-sm mt-1">{spot.difficulty}</span>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-slate-100">
                                <div className="text-teal-500 mb-2"><Waves size={20} /></div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('spot.height')}</span>
                                <span className="font-bold text-slate-800 text-sm mt-1">{spot.height || '-'}m</span>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-slate-100">
                                <div className="text-amber-500 mb-2">📷</div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Photos</span>
                                <div
                                    className="h-20 w-full mt-2 rounded-lg overflow-hidden bg-slate-200 relative cursor-pointer hover:opacity-80 transition-opacity"
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
                                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                    +{spot.image_urls.length - 1}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="font-bold text-slate-800 mb-3 text-base">{t('spot.desc')}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                {language === 'fr' && spot.description_fr ? spot.description_fr : spot.description}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Image Gallery Lightbox */}
            <AnimatePresence>
                {isImageOpen && spot?.image_urls && spot.image_urls.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[6000] bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setIsImageOpen(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') {
                                setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : spot.image_urls!.length - 1);
                            } else if (e.key === 'ArrowRight') {
                                setCurrentPhotoIndex(prev => prev < spot.image_urls!.length - 1 ? prev + 1 : 0);
                            } else if (e.key === 'Escape') {
                                setIsImageOpen(false);
                            }
                        }}
                        tabIndex={0}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsImageOpen(false)}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                        >
                            <X size={24} className="text-white" />
                        </button>

                        {/* Photo Counter */}
                        <div className="absolute top-6 left-6 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
                            {currentPhotoIndex + 1} / {spot.image_urls.length}
                        </div>

                        {/* Left Arrow */}
                        {spot.image_urls.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : spot.image_urls!.length - 1);
                                }}
                                className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                            >
                                <ChevronLeft size={32} className="text-white" />
                            </button>
                        )}

                        {/* Image */}
                        <motion.img
                            key={currentPhotoIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            src={spot.image_urls[currentPhotoIndex]}
                            alt={`${spot.name} - Photo ${currentPhotoIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Right Arrow */}
                        {spot.image_urls.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPhotoIndex(prev => prev < spot.image_urls!.length - 1 ? prev + 1 : 0);
                                }}
                                className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                            >
                                <ChevronRight size={32} className="text-white" />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}
