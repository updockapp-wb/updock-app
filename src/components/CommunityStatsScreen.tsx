import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { spots as staticSpots } from '../data/spots';
import { getCountryFromCoords, countryCodeToFlag } from '../utils/countryFromCoords';

interface CommunityStatsScreenProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CountryCount {
    code: string;
    name: string;
    count: number;
}

export default function CommunityStatsScreen({ isOpen, onClose }: CommunityStatsScreenProps) {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [totalSpots, setTotalSpots] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [countryCounts, setCountryCounts] = useState<CountryCount[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);

        const fetchStats = async () => {
            // 1. Fetch total approved DB spots count
            const { count: dbSpotsCount } = await supabase
                .from('spots')
                .select('id', { count: 'exact', head: true })
                .eq('is_approved', true);

            const dbCount = dbSpotsCount ?? 0;
            setTotalSpots(dbCount + staticSpots.length);

            // 2. Fetch total users count
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true });

            setTotalUsers(usersCount ?? 0);

            // 3. Fetch all approved DB spot coordinates
            const { data: dbSpots } = await supabase
                .from('spots')
                .select('lat, lng')
                .eq('is_approved', true);

            // 4. Combine DB coordinates with static spot positions
            const allPositions: Array<[number, number]> = [
                ...staticSpots.map((s) => s.position as [number, number]),
                ...((dbSpots ?? [])
                    .filter((s) => s.lat != null && s.lng != null)
                    .map((s) => [s.lat, s.lng] as [number, number])),
            ];

            // 5 & 6. Derive country for each position and aggregate counts
            const countryMap: Record<string, CountryCount> = {};
            for (const [lat, lng] of allPositions) {
                const { code, name } = getCountryFromCoords(lat, lng);
                if (!countryMap[code]) {
                    countryMap[code] = { code, name, count: 0 };
                }
                countryMap[code].count++;
            }

            // Sort descending by count
            const sorted = Object.values(countryMap).sort((a, b) => b.count - a.count);
            setCountryCounts(sorted);

            setLoading(false);
        };

        fetchStats();
    }, [isOpen]);

    if (!isOpen) return null;

    const fmt = (n: number) =>
        new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US').format(n);

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white">
                <button
                    onClick={onClose}
                    className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-slate-800">{t('community_stats.title')}</h1>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">
                                    {t('community_stats.total_spots')}
                                </p>
                                <p className="text-2xl font-black text-slate-800">{fmt(totalSpots)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-slate-400 text-xs font-bold uppercase mb-1">
                                    {t('community_stats.total_users')}
                                </p>
                                <p className="text-2xl font-black text-slate-800">{fmt(totalUsers)}</p>
                            </div>
                        </div>

                        {/* Spots by Country */}
                        {countryCounts.length > 0 && (
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-3">
                                    {t('community_stats.spots_by_country')}
                                </p>
                                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                    {countryCounts.map(({ code, name, count }) => (
                                        <div
                                            key={code}
                                            className="flex items-center justify-between p-4 border-b border-slate-50 last:border-b-0"
                                        >
                                            <span className="text-sm font-medium text-slate-700">
                                                {countryCodeToFlag(code)} {name}
                                            </span>
                                            <span className="text-sm font-bold text-slate-500">
                                                {fmt(count)} {t('community_stats.spots_count')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
