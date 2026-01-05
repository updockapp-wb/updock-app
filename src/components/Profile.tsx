import { User, CreditCard, ChevronRight, Globe, LogOut, LogIn, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import PremiumModal from './PremiumModal';

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

    const isAdmin = user?.email === 'updock.app@gmail.com';

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
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 p-1 shadow-lg shadow-sky-200">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {user ? (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-sky-600">
                                {user.user_metadata?.first_name
                                    ? user.user_metadata.first_name.charAt(0).toUpperCase()
                                    : user.email?.charAt(0).toUpperCase()}
                            </div>
                        ) : (
                            <User size={40} className="text-slate-300" />
                        )}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Dockstarter</h2>
                    {user ? (
                        <>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${level.bg} ${level.color}`}>
                                {level.name}
                            </span>
                            <h3 className="font-bold text-slate-800 text-sm mt-1 truncate max-w-[150px]">
                                {user.user_metadata?.first_name
                                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                                    : user.user_metadata?.username || user.email}
                            </h3>
                            {user.user_metadata?.username && (
                                <p className="text-slate-400 text-xs text-center">@{user.user_metadata.username}</p>
                            )}
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
