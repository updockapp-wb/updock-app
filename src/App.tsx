import { useState, useCallback, useEffect as useLayoutEffect, lazy, Suspense } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import { supabase } from './lib/supabase';
import { Heart } from 'lucide-react';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
// Code-split the large, conditionally-visible surfaces (D-06/D-07/D-08) so their
// chunks stay off the initial parse path. Mapbox GL alone is ~54.5% of gzip JS.
const Map = lazy(() => import('./components/Map'));
import NavBar from './components/NavBar';
import Profile from './components/Profile';
import NearbySpotsList from './components/NearbySpotsList';

import { useFavorites } from './context/useFavorites';
import { useSpots } from './context/useSpots';
import { useLanguage } from './context/useLanguage';
import { LanguageProvider } from './context/LanguageContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { SpotsProvider } from './context/SpotsContext';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { ProfileProvider } from './context/ProfileContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { SessionsProvider } from './context/SessionsContext';
import AuthModal from './components/AuthModal';
import SpotDetail from './components/SpotDetail';
import WelcomeScreen from './components/WelcomeScreen';
// Gated lazy mount: the ~490-line admin chunk is never fetched for non-admins (D-08, T-05-06).
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
import { type Spot } from './data/spots';

// Map-area fallback shown while the lazy Mapbox chunk loads. Reuses the
// auth-loading spinner and is confined to the map area so the nav stays
// interactive (D-07). No eager preload at login.
function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<'map' | 'favorites' | 'list' | 'profile'>('map');
  const { favorites, toggleFavorite } = useFavorites();
  const { spots } = useSpots();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const favoritesSpots = spots.filter(s => favorites.includes(s.id));

  // Lifted state used for Map interaction triggered from NavBar
  const [isAddingSpotMode, setIsAddingSpotMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  // Détection du redirect de confirmation d'email (web) : l'état initial est dérivé du hash
  // au premier rendu (pas de setState dans l'effet), l'effet ne garde que le nettoyage d'URL.
  const isEmailConfirmRedirect = () => {
    const hash = window.location.hash;
    return !!(hash && (hash.includes('access_token=') || hash.includes('type=signup')));
  };
  const [showWelcome, setShowWelcome] = useState(isEmailConfirmRedirect);

  // Nettoyage de l'URL après un redirect de confirmation d'email (web)
  useLayoutEffect(() => {
    if (isEmailConfirmRedirect()) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Detect Redirect from Email Confirmation (native iOS/Android via Universal Links)
  useLayoutEffect(() => {
    const listener = CapApp.addListener('appUrlOpen', async (event) => {
      const url = new URL(event.url);
      const hash = url.hash;
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        setShowWelcome(true);
      }
    });
    return () => { listener.then(l => l.remove()); };
  }, []);



  // NavBar props must stay referentially stable so that memo(NavBar) can skip re-renders
  // triggered by non-nav state changes (selectedSpot, isAuthModalOpen…) — PERF-01.
  // React state setters are themselves stable, so these callbacks never change identity.
  const handleTabChange = useCallback((tab: 'map' | 'favorites' | 'list' | 'profile') => {
    setActiveTab(tab);
    setSelectedSpot(null);
  }, [setActiveTab, setSelectedSpot]);

  const handleAddSpotClick = useCallback(() => setIsAddingSpotMode(true), [setIsAddingSpotMode]);

  const handleOpenAuth = useCallback(() => setIsAuthModalOpen(true), [setIsAuthModalOpen]);

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
  };

  const handleSpotSelect = (spot: Spot) => {
    setIsAdminOpen(false);
    setActiveTab('map'); // Switch to map tab
    setSelectedSpot(spot);
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex flex-col md:flex-row bg-slate-50 text-slate-900 overflow-hidden">

      <div vaul-drawer-wrapper="" className="w-full h-full flex flex-col md:flex-row bg-white">
          {/* Desktop Sidebar - Visible only on md+ */}
          <div className="hidden md:flex flex-col w-64 h-full bg-white border-r border-slate-200 z-50 shrink-0">
            <div className="p-6 flex items-center gap-3">
              <img src="/icon.png" alt="Updock" className="h-10 w-10 rounded-xl object-cover" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">UPDOCK</h1>
            </div>

            <div className="flex-1 px-4 py-4 space-y-2">
              <NavBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onAddSpotClick={handleAddSpotClick}
                isVertical={true}
                user={user}
                onOpenAuth={handleOpenAuth}
              />
            </div>

            <div className="p-4 border-t border-slate-100">
              <button className="w-full py-2 px-4 rounded-lg hover:bg-slate-50 text-slate-600 font-medium text-sm flex items-center gap-2 transition-colors">
                <span>v{__APP_VERSION__}</span>
              </button>
            </div>
          </div>

          <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'map' && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 relative w-full h-full"
                >
                  <ErrorBoundary
                    fallback={(retry) => (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center">
                        <p className="text-slate-600">{t('error.load_failed')}</p>
                        <button
                          onClick={retry}
                          className="px-4 py-2 rounded-lg bg-sky-500 text-white font-medium"
                        >
                          {t('error.retry')}
                        </button>
                      </div>
                    )}
                  >
                    <Suspense fallback={<MapSkeleton />}>
                      <Map
                        onSpotClick={handleSpotClick}
                        selectedSpot={selectedSpot}
                        isAddingSpotMode={isAddingSpotMode}
                        onSetAddingSpotMode={setIsAddingSpotMode}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full flex flex-col p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] overflow-y-auto max-w-4xl mx-auto"
                >
                  <h2 className="text-3xl font-bold text-slate-800 mb-6">{t('fav.title')}</h2>
                  {favoritesSpots.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
                      <Heart size={48} className="mb-4 opacity-20" />
                      <p className="text-lg">{t('fav.empty')}</p>
                      <button onClick={() => setActiveTab('map')} className="text-sky-500 font-bold mt-4 hover:underline">{t('fav.explore')}</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoritesSpots.map(spot => (
                        <div key={spot.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex justify-between items-center group cursor-pointer" onClick={() => { setSelectedSpot(spot); setActiveTab('map'); }}>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">{spot.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-md">{spot.type}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            iconOnly
                            aria-label={t('fav.remove')}
                            className="!p-2 text-rose-500 hover:!bg-rose-50 w-11 h-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(spot.id).catch(() => Toast.show({ text: t('fav.error.revert'), duration: 'short' }));
                            }}
                          >
                            <Heart size={20} className="fill-rose-500 text-rose-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] overflow-y-auto max-w-2xl mx-auto"
                >
                  <NearbySpotsList
                    onSpotClick={(spot) => {
                      setSelectedSpot(spot);
                      setActiveTab('map');
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full overflow-y-auto"
                >
                  <div className="max-w-2xl mx-auto py-8 px-4 pt-[calc(2rem+env(safe-area-inset-top))]">
                    <Profile
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                      onAdminClick={() => setIsAdminOpen(true)}
                      onSpotSelect={(spotId) => { const spot = spots.find(s => s.id === spotId); if (spot) setSelectedSpot(spot); }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global Spot Detail - Triggered from any tab */}
            <AnimatePresence>
              {selectedSpot && (
                <SpotDetail
                  spot={selectedSpot}
                  onClose={() => setSelectedSpot(null)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation - Hidden on md+ */}
            <div className="md:hidden z-[1001]">
              <NavBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onAddSpotClick={handleAddSpotClick}
                user={user}
                onOpenAuth={handleOpenAuth}
              />
            </div>
          </main>
        </div>

      {/* Global overlays — rendered OUTSIDE vaul-drawer-wrapper so they escape the
          background-scale transform SpotDetail's shouldScaleBackground drawer applies
          to that wrapper; otherwise their z-index is compared in a local stacking
          context and loses to the drawer's body-portaled content (T-03-06 recette). */}
      {isAdminOpen && (
        <Suspense fallback={null}>
          <AdminDashboard
            isOpen
            onClose={() => setIsAdminOpen(false)}
            onSpotSelect={handleSpotSelect}
          />
        </Suspense>
      )}

      <AnimatePresence>
        {showWelcome && (
          <WelcomeScreen onClose={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SpotsProvider>
            <FavoritesProvider>
              <ProfileProvider>
                <NotificationsProvider>
                  <SessionsProvider>
                    <AppContent />
                  </SessionsProvider>
                </NotificationsProvider>
              </ProfileProvider>
            </FavoritesProvider>
          </SpotsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
