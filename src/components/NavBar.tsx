import { Map, Heart, User, Plus, List, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavBarProps {
    activeTab: 'map' | 'favorites' | 'list' | 'profile';
    onTabChange: (tab: 'map' | 'favorites' | 'list' | 'profile') => void;
    onAddSpotClick?: () => void;
    isVertical?: boolean;
    user?: { id: string } | null;
    onOpenAuth?: () => void;
}

export default function NavBar({ activeTab, onTabChange, onAddSpotClick, isVertical = false, user, onOpenAuth }: NavBarProps) {
    const { t } = useLanguage();

    if (isVertical) {
        return (
            <div className="flex flex-col gap-2 w-full">
                <button
                    onClick={() => onTabChange('map')}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left ${activeTab === 'map' ? 'bg-sky-50 text-sky-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    <Map size={20} strokeWidth={activeTab === 'map' ? 2.5 : 2} />
                    <span className="text-sm">{t('nav.map')}</span>
                </button>

                <button
                    onClick={() => {
                        if (!user && onOpenAuth) { onOpenAuth(); return; }
                        onTabChange('favorites');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left ${activeTab === 'favorites' ? 'bg-sky-50 text-sky-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    <Heart size={20} fill={activeTab === 'favorites' ? "currentColor" : "none"} strokeWidth={activeTab === 'favorites' ? 2.5 : 2} />
                    <div className="flex items-center gap-1">
                        <span className="text-sm">{t('nav.favorites')}</span>
                        {!user && <Lock size={12} className="text-slate-400" />}
                    </div>
                </button>

                <button
                    onClick={() => onTabChange('list')}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left ${activeTab === 'list' ? 'bg-sky-50 text-sky-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    <List size={20} strokeWidth={activeTab === 'list' ? 2.5 : 2} />
                    <span className="text-sm">{t('nav.list')}</span>
                </button>

                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left ${activeTab === 'profile' ? 'bg-sky-50 text-sky-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    <User size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                    <span className="text-sm">{t('nav.profile')}</span>
                </button>

                {onAddSpotClick && (
                    <button
                        onClick={() => {
                            if (!user && onOpenAuth) { onOpenAuth(); return; }
                            onAddSpotClick();
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left mt-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold">Add Spot</span>
                            {!user && <Lock size={12} className="text-white/70" />}
                        </div>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white border-t border-slate-100 flex items-center justify-between px-2 z-[1000] relative shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pt-2 pb-[env(safe-area-inset-bottom)]">
            {/* Left Side (Map, Favorites) */}
            <div className="flex items-center flex-1 justify-around">
                <button
                    onClick={() => onTabChange('map')}
                    className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'map' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-500'}`}
                >
                    <Map size={24} strokeWidth={activeTab === 'map' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{t('nav.map')}</span>
                </button>

                <button
                    onClick={() => {
                        if (!user && onOpenAuth) { onOpenAuth(); return; }
                        onTabChange('favorites');
                    }}
                    className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'favorites' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-500'}`}
                >
                    <Heart size={24} fill={activeTab === 'favorites' ? "currentColor" : "none"} strokeWidth={activeTab === 'favorites' ? 2.5 : 2} />
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium">{t('nav.favorites')}</span>
                        {!user && <Lock size={10} className="text-slate-400" />}
                    </div>
                </button>
            </div>

            {/* Center Action Button (Floating) */}
            <div className="relative w-16 -top-6 flex justify-center">
                <button
                    onClick={() => {
                        if (!user && onOpenAuth) { onOpenAuth(); return; }
                        onAddSpotClick?.();
                    }}
                    className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-transform border-4 border-white relative overflow-visible"
                >
                    <Plus size={32} strokeWidth={3} />
                    {!user && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white rounded-full border border-slate-200 flex items-center justify-center">
                            <Lock size={10} className="text-slate-400" />
                        </span>
                    )}
                </button>
            </div>

            {/* Right Side (List, Profile) */}
            <div className="flex items-center flex-1 justify-around">
                <button
                    onClick={() => onTabChange('list')}
                    className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'list' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-500'}`}
                >
                    <List size={24} strokeWidth={activeTab === 'list' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{t('nav.list')}</span>
                </button>

                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'profile' ? 'text-sky-500' : 'text-slate-400 hover:text-slate-500'}`}
                >
                    <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{t('nav.profile')}</span>
                </button>
            </div>
        </div>
    );
}
