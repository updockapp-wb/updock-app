import { useState } from 'react';
import { Heart } from 'lucide-react';
import Map from './components/Map';
import NavBar from './components/NavBar';
import Profile from './components/Profile';
import NearbySpots from './components/NearbySpots';
import LandingPage from './components/LandingPage';
import { useFavorites } from './context/FavoritesContext';
import { useSpots } from './context/SpotsContext';
import { useLanguage } from './context/LanguageContext';
import { LanguageProvider } from './context/LanguageContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { SpotsProvider } from './context/SpotsContext';
import { PremiumProvider } from './context/PremiumContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import SpotDetail from './components/SpotDetail';
import AdminDashboard from './components/AdminDashboard';
import { type Spot } from './data/spots';

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

      {/* Auth Wall: If not logged in, show Landing Page */}
      {!user ? (
        <>
          <LandingPage onStart={() => setIsAuthModalOpen(true)} />
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
      ) : (
        /* Main App Content (Only if Logged In) */
        <>
          {/* Desktop Sidebar - Visible only on md+ */}
          <div className="hidden md:flex flex-col w-64 h-full bg-white border-r border-slate-200 z-50 shrink-0">
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-sky-500/30">
                U
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">UPDOCK</h1>
            </div>

            <div className="flex-1 px-4 py-4 space-y-2">
              <NavBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddSpotClick={() => setIsAddingSpotMode(true)}
                isVertical={true}
              />
            </div>

            <div className="p-4 border-t border-slate-100">
              <button className="w-full py-2 px-4 rounded-lg hover:bg-slate-50 text-slate-600 font-medium text-sm flex items-center gap-2 transition-colors">
                <span>v1.1.0 (Beta)</span>
              </button>
            </div>
          </div>

          <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
            {activeTab === 'map' && (
              <div className="flex-1 relative w-full h-full">
                <Map
                  onSpotClick={handleSpotClick}
                  selectedSpot={selectedSpot}
                  isAddingSpotMode={isAddingSpotMode}
                  onSetAddingSpotMode={setIsAddingSpotMode}
                />
                {selectedSpot && (
                  <SpotDetail
                    spot={selectedSpot}
                    onClose={() => setSelectedSpot(null)}
                  />
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="w-full h-full flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(spot.id);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        >
                          <Heart size={20} className="fill-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'list' && (
              <NearbySpots
                onSpotClick={(spot) => {
                  setSelectedSpot(spot);
                  setActiveTab('map');
                }}
              />
            )}

            {activeTab === 'profile' && (
              <div className="w-full h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto py-8 px-4">
                  <Profile
                    onOpenAuth={() => setIsAuthModalOpen(true)}
                    onAdminClick={() => setIsAdminOpen(true)}
                  />
                </div>
              </div>
            )}

            {/* Mobile Bottom Navigation - Hidden on md+ */}
            <div className="md:hidden z-[1001]">
              <NavBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddSpotClick={() => setIsAddingSpotMode(true)}
              />
            </div>
          </main>

          <AdminDashboard
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            onSpotSelect={handleSpotSelect}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PremiumProvider>
          <FavoritesProvider>
            <SpotsProvider>
              <AppContent />
            </SpotsProvider>
          </FavoritesProvider>
        </PremiumProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
