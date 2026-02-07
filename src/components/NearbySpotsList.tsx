import { motion } from 'framer-motion';
import { MapPin, Navigation, ChevronRight } from 'lucide-react';
import { useSpots } from '../context/SpotsContext';
import { useLanguage } from '../context/LanguageContext';
import { type Spot } from '../data/spots';
import { formatDistance } from '../utils/distance';

interface NearbySpotsListProps {
    onSpotClick: (spot: Spot) => void;
}

export default function NearbySpotsList({ onSpotClick }: NearbySpotsListProps) {
    const { nearbySpots, userLocation } = useSpots();
    const { t } = useLanguage();

    if (!userLocation || nearbySpots.length === 0) {
        return null;
    }

    return (
        <div className="bg-white/95 backdrop-blur-md rounded-[32px] p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-sky-500/10 p-2 rounded-xl">
                    <Navigation className="text-sky-500" size={20} />
                </div>
                <h3 className="font-bold text-slate-900">{t('nearby.title') || "Nearest Spots"}</h3>
            </div>

            <div className="space-y-3">
                {nearbySpots.map((spot, index) => (
                    <motion.button
                        key={spot.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSpotClick(spot)}
                        className="w-full group flex items-center justify-between p-3 rounded-2xl hover:bg-sky-50 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors capitalize">
                                {spot.name.charAt(0)}
                            </div>
                            <div>
                                <motion.p
                                    layoutId={`spot-name-${spot.id}`}
                                    className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1"
                                >
                                    {spot.name}
                                </motion.p>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <MapPin size={10} />
                                    <span>{formatDistance(spot.distance || 0)}</span>
                                    <span className="mx-1">•</span>
                                    <span>{spot.type[0]}</span>
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
