import { User, CreditCard, ChevronRight, Globe, LogOut, LogIn, Shield, Camera, Calendar, Users, Bell, MapPin, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useState, useRef, useEffect } from 'react';
import { useSessions } from '../context/SessionsContext';
import { useNotifications } from '../context/NotificationsContext';
import PremiumModal from './PremiumModal';
import CommunityStatsScreen from './CommunityStatsScreen';
import { supabase } from '../lib/supabase';

interface ProfileProps {
    onOpenAuth?: () => void;
    onAdminClick?: () => void;
    onSpotSelect?: (spotId: string) => void;
}

export default function Profile({ onOpenAuth, onAdminClick, onSpotSelect }: ProfileProps) {
    const { t, language, setLanguage } = useLanguage();
    const { favorites } = useFavorites();
    const { user, signOut } = useAuth();
    const { profile, updateDisplayName, uploadAvatar } = useProfile();
    const [spotsCount, setSpotsCount] = useState(0);

    const [isPremiumOpen, setIsPremiumOpen] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCommunityStatsOpen, setIsCommunityStatsOpen] = useState(false);
    const [anonTotalSpots, setAnonTotalSpots] = useState<number | null>(null);
    const [anonTotalUsers, setAnonTotalUsers] = useState<number | null>(null);

    const { userUpcomingSessions, fetchUserSessions } = useSessions();
    const { permissionStatus, checkPermission } = useNotifications();

    useEffect(() => {
        if (!user) { setSpotsCount(0); return; }
        supabase
            .from('spots')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .then(({ count }) => setSpotsCount(count ?? 0));
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchUserSessions();
        }
    }, [user]);

    useEffect(() => {
        checkPermission();
    }, []);

    useEffect(() => {
        if (user) return;
        supabase
            .from('spots')
            .select('id', { count: 'exact', head: true })
            .eq('is_approved', true)
            .then(({ count }) => setAnonTotalSpots((count ?? 0) + 10)); // +10 for static spots
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .then(({ count }) => setAnonTotalUsers(count ?? 0));
    }, [user]);

    // Anonymous Profile Screen
    if (!user) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col items-center justify-center px-6 bg-slate-50"
            >
                {/* Illustration */}
                <div className="w-[120px] h-[120px] rounded-full bg-sky-50 flex items-center justify-center">
                    <MapPin size={48} className="text-sky-500" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-slate-800 text-center mt-6">
                    {t('anon_profile.title')}
                </h2>

                {/* Subtitle */}
                <p className="text-base font-normal text-slate-500 text-center mt-2 max-w-[280px]">
                    {t('anon_profile.subtitle')}
                </p>

                {/* Sign in button (primary) */}
                <button
                    onClick={() => onOpenAuth?.()}
                    className="w-full max-w-[320px] bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl mt-8 transition-colors"
                >
                    {t('anon_profile.btn_login')}
                </button>

                {/* Create account button (secondary) */}
                <button
                    onClick={() => onOpenAuth?.()}
                    className="w-full max-w-[320px] bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl mt-3 hover:bg-slate-50 transition-colors"
                >
                    {t('anon_profile.btn_signup')}
                </button>

                {/* Community stats preview */}
                {anonTotalSpots !== null && anonTotalUsers !== null && (
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <span className="text-sm text-slate-400">
                            {anonTotalSpots} spots
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-sm text-slate-400">
                            {anonTotalUsers} riders
                        </span>
                    </div>
                )}

                {/* Language toggle (settings accessible for anonymous) */}
                <div className="mt-12 w-full max-w-[320px]">
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
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
                    </div>
                </div>

                {/* Version */}
                <p className="text-xs text-slate-300 mt-8">Updock v1.1.3 (Beta)</p>
            </motion.div>
        );
    }

    const isAdmin = user?.email === 'updock.app@gmail.com';

    return (
        <div className="w-full h-full flex flex-col p-6 overflow-y-auto bg-slate-50">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 p-1 shadow-lg shadow-sky-200">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            ) : (
                                <User size={40} className="text-slate-300" />
                            )}
                        </div>
                    </div>
                    {user && (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 text-sky-500 hover:text-sky-600 transition-transform active:scale-90"
                            >
                                <Camera size={14} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        await uploadAvatar(file);
                                    }
                                    e.target.value = '';
                                }}
                            />
                        </>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {user ? (profile?.display_name || user?.email?.split('@')[0] || 'Updocker') : 'Guest'}
                    </h2>
                    {user ? (
                        <>
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

            {/* Display Name Section */}
            {user && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-500 mb-2">{t('profile.display_name')}</label>
                    {editingName ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                maxLength={30}
                                className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none font-medium"
                                placeholder={t('profile.name_placeholder')}
                                autoFocus
                            />
                            <button
                                onClick={async () => {
                                    if (nameInput.trim()) {
                                        await updateDisplayName(nameInput.trim());
                                    }
                                    setEditingName(false);
                                }}
                                className="px-4 py-3 bg-sky-500 text-white rounded-xl font-medium"
                            >
                                {t('profile.save')}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setNameInput(profile?.display_name || '');
                                setEditingName(true);
                            }}
                            className="w-full text-left p-3 bg-slate-50 rounded-xl font-medium text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            {profile?.display_name || t('profile.set_name')}
                        </button>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Spots Added</p>
                    <p className="text-2xl font-black text-slate-800">{spotsCount}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Favorites</p>
                    <p className="text-2xl font-black text-slate-800">{favorites.length}</p>
                </div>
            </div>

            {/* Upcoming Sessions */}
            {user && userUpcomingSessions.length > 0 && (
                <div className="mt-6 mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">{t('session.upcoming')}</h3>
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        {userUpcomingSessions.map((session, index) => {
                            const date = new Date(session.starts_at);
                            const dateStr = date.toLocaleDateString();
                            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => onSpotSelect?.(session.spot_id)}
                                    className={`w-full flex items-center gap-3 py-3 px-4 text-left ${
                                        index < userUpcomingSessions.length - 1 ? 'border-b border-slate-100' : ''
                                    }`}
                                >
                                    <Calendar size={16} className="text-sky-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{session.spot_name}</p>
                                        <p className="text-xs text-slate-400">{dateStr} {timeStr}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Users size={12} className="text-slate-400" />
                                        <span className="text-xs text-slate-400">{session.attendee_count}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Community Stats Nav Row */}
            <div
                onClick={() => setIsCommunityStatsOpen(true)}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-6 cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-slate-700">
                        <BarChart2 size={20} className="text-sky-500" />
                        <span className="font-medium">{t('community_stats.nav_label')}</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
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

                {/* Notification Status */}
                <div
                    onClick={permissionStatus === 'denied' ? () => {
                        // Open system settings on iOS
                        window.location.href = 'app-settings:';
                    } : undefined}
                    className={`flex items-center justify-between p-4 border-b border-slate-50 ${permissionStatus === 'denied' ? 'hover:bg-slate-50 transition-colors cursor-pointer' : ''}`}
                >
                    <div className="flex items-center gap-3 text-slate-700">
                        <Bell size={20} className={permissionStatus === 'granted' ? 'text-sky-500' : 'text-slate-400'} />
                        <span className="font-medium">{t('profile.notifications')}</span>
                    </div>
                    {permissionStatus === 'granted' && (
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">
                            {t('notification.active')}
                        </span>
                    )}
                    {permissionStatus === 'denied' && (
                        <span className="text-xs text-slate-500">
                            {t('notification.disabled')}
                        </span>
                    )}
                    {permissionStatus === 'unknown' && (
                        <ChevronRight size={20} className="text-slate-300" />
                    )}
                    {permissionStatus === 'loading' && (
                        <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    )}
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
                <p className="text-xs text-slate-300">Updock v1.1.3 (Beta)</p>
            </div>

            <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />

            <CommunityStatsScreen
                isOpen={isCommunityStatsOpen}
                onClose={() => setIsCommunityStatsOpen(false)}
            />
        </div>
    );
}
