import { User, CreditCard, ChevronRight, Globe, LogOut, LogIn, Shield, Edit2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PremiumModal from './PremiumModal';

// Avatar assets mapping
const AVATARS = [
    { id: 1, src: '/src/assets/avatars/avatar1.svg', name: 'Wave Rider' },
    { id: 2, src: '/src/assets/avatars/avatar2.svg', name: 'Wind Sail' },
    { id: 3, src: '/src/assets/avatars/avatar3.svg', name: 'Sea Sun' },
    { id: 4, src: '/src/assets/avatars/avatar4.svg', name: 'Deep Fin' },
    { id: 5, src: '/src/assets/avatars/avatar5.svg', name: 'Anchor Point' },
];

interface ProfileProps {
    onOpenAuth?: () => void;
    onAdminClick?: () => void;
}

export default function Profile({ onOpenAuth, onAdminClick }: ProfileProps) {
    const { t, language, setLanguage } = useLanguage();
    const { favorites } = useFavorites();
    const { user, signOut } = useAuth();
    const spotsCount = favorites.length;

    const [isPremiumOpen, setIsPremiumOpen] = useState(false);
    const [avatarId, setAvatarId] = useState<number>(1);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isAdmin = user?.email === 'updock.app@gmail.com';

    // Fetch profile data (including avatar_id)
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('avatar_id')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                setAvatarId(data.avatar_id);
            }
        };

        fetchProfile();
    }, [user]);

    const handleAvatarSelect = async (id: number) => {
        if (!user) return;
        setIsUpdating(true);

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, avatar_id: id });

        if (!error) {
            setAvatarId(id);
            setIsAvatarPickerOpen(false);
        }
        setIsUpdating(false);
    };

    const currentAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

    // Simple gamification logic
    const getLevel = (count: number) => {
        if (count >= 10) return { name: 'Expert', color: 'text-amber-500', bg: 'bg-amber-100' };
        if (count >= 5) return { name: 'Pro', color: 'text-sky-500', bg: 'bg-sky-100' };
        return { name: 'Rookie', color: 'text-teal-500', bg: 'bg-teal-100' };
    };

    const level = getLevel(spotsCount);

    return (
        <div className="w-full h-full flex flex-col p-6 overflow-y-auto bg-slate-50">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 p-1 shadow-lg shadow-sky-200">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {user ? (
                                <img
                                    src={currentAvatar.src}
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            ) : (
                                <User size={40} className="text-slate-300" />
                            )}
                        </div>
                    </div>
                    {user && (
                        <button
                            onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                            className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 text-sky-500 hover:text-sky-600 transition-transform active:scale-90"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {user ? (user.user_metadata?.first_name || 'Updocker') : 'Guest'}
                    </h2>
                    {user ? (
                        <>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${level.bg} ${level.color}`}>
                                {level.name}
                            </span>
                            <p className="text-slate-400 text-sm mt-1 truncate max-w-[200px]">
                                {user.email}
                            </p>
                        </>
                    ) : (
                        <div className="flex flex-col items-start gap-2 mt-1">
                            <button
                                onClick={onOpenAuth}
                                className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                            >
                                <LogIn size={14} />
                                Sign In / Join
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Avatar Picker Modal/Popover */}
            {isAvatarPickerOpen && (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Choose Avatar</h4>
                        <button onClick={() => setIsAvatarPickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {AVATARS.map((avatar) => (
                            <button
                                key={avatar.id}
                                onClick={() => handleAvatarSelect(avatar.id)}
                                disabled={isUpdating}
                                className={`aspect-square rounded-2xl p-1 transition-all ${avatarId === avatar.id ? 'bg-sky-50 ring-2 ring-sky-500 scale-105' : 'bg-slate-50 hover:bg-slate-100 hover:scale-105'}`}
                            >
                                <img src={avatar.src} alt={avatar.name} className="w-full h-full" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Spots Added</p>
                    <p className="text-2xl font-black text-slate-800">0</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Favorites</p>
                    <p className="text-2xl font-black text-slate-800">{spotsCount}</p>
                </div>
            </div>

            {/* Settings Sections */}
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 ml-2">{t('profile.settings')}</h3>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-6">
                {/* Language Toggle */}
                <div className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 text-slate-700">
                        <Globe size={20} className="text-sky-500" />
                        <span className="font-medium">{t('profile.language')}</span>
                    </div>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setLanguage('fr')}
                            className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${language === 'fr' ? 'bg-white shadow text-sky-600' : 'text-slate-400'}`}
                        >
                            FR
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${language === 'en' ? 'bg-white shadow text-sky-600' : 'text-slate-400'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <div
                    onClick={() => setIsPremiumOpen(true)}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-3 text-slate-700">
                        <CreditCard size={20} className="text-rose-500" />
                        <span className="font-medium">{t('profile.go_premium')}</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </div>

                {isAdmin && (
                    <div
                        onClick={onAdminClick}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer border-t border-slate-50"
                    >
                        <div className="flex items-center gap-3 text-slate-700">
                            <Shield size={20} className="text-emerald-500" />
                            <span className="font-bold text-emerald-600">{t('profile.admin_dashboard')}</span>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                    </div>
                )}
            </div>

            {user && (
                <button
                    onClick={() => signOut()}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-4 rounded-2xl transition-all mb-8 flex items-center justify-center gap-2"
                >
                    <LogOut size={18} />
                    Log Out
                </button>
            )}

            <div className="mt-auto text-center pb-8">
                <p className="text-xs text-slate-300">Updock v1.1.0 (Beta)</p>
            </div>

            <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
        </div>
    );
}
