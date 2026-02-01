import { useState, useEffect } from 'react';
import { useSpots } from '../context/SpotsContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import type { Spot } from '../data/spots';

interface NearbySpotsProps {
    onSpotClick?: (spot: Spot) => void;
    className?: string;
}

export default function NearbySpots({ onSpotClick, className = '' }: NearbySpotsProps) {
    const { spots } = useSpots();
    const { t } = useLanguage();

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortedSpots, setSortedSpots] = useState<{ spot: Spot; distance: number }[]>([]);

    // Function to calculate Haversine distance (in km)
    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLoading(false);

                // Calculate distances
                const spotsWithDistance = spots.map(spot => {
                    const distance = getDistanceFromLatLonInKm(
                        position.coords.latitude,
                        position.coords.longitude,
                        spot.position[0],
                        spot.position[1]
                    );
                    return { spot, distance };
                });

                // Sort by distance
                spotsWithDistance.sort((a, b) => a.distance - b.distance);
                setSortedSpots(spotsWithDistance);
            },
            (err) => {
                setError('Unable to retrieve your location');
                setLoading(false);
                console.error(err);

                // Fallback: Just show spots alphabetically if no location
                const fallbackSpots = spots.map(spot => ({ spot, distance: 0 }));
                setSortedSpots(fallbackSpots);
            }
        );
    }, [spots]);

    const handleNavigate = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    return (
        <div className={`w-full h-full flex flex-col p-6 overflow-y-auto pb-24 ${className}`}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin className="text-sky-500" />
                {t('nearby.title') || 'Nearest Spots'}
            </h2>

            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="animate-spin mb-2" />
                    <p>Locating you...</p>
                </div>
            )}

            {error && !loading && (
                <div className="mb-4 p-4 bg-orange-50 text-orange-600 rounded-xl text-sm border border-orange-100">
                    <p>⚠️ {error}. Showing all spots.</p>
                </div>
            )}

            <div className="space-y-3">
                {sortedSpots.map(({ spot, distance }) => (
                    <div
                        key={spot.id}
                        onClick={() => onSpotClick && onSpotClick(spot)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-sky-200 transition-colors cursor-pointer"
                    >
                        <div>
                            <h3 className="font-bold text-slate-800">{spot.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md ${spot.type.includes('Dockstart') ? 'bg-sky-100 text-sky-700' :
                                    spot.type.includes('Rockstart') ? 'bg-pink-100 text-pink-700' :
                                        spot.type.includes('Dropstart') ? 'bg-teal-100 text-teal-700' :
                                            spot.type.includes('Deadstart') ? 'bg-indigo-100 text-indigo-700' :
                                                spot.type.includes('Rampstart') ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                    }`}>
                                    {spot.type[0]}
                                </span>
                                {distance > 0 && (
                                    <span className="text-xs text-slate-400 font-medium">
                                        {distance < 1
                                            ? `${Math.round(distance * 1000)}m`
                                            : `${distance.toFixed(1)} km`}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(spot.position[0], spot.position[1]);
                            }}
                            className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                        >
                            <Navigation size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
