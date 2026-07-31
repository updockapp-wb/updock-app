import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { cacheSpotImages } from '../utils/offline';
import { useSpots } from './useSpots';
import { FavoritesContext } from './useFavorites';

export interface FavoritesContextType {
    favorites: string[];
    toggleFavorite: (spotId: string) => Promise<void>;
    isFavorite: (spotId: string) => boolean;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<string[]>(() => {
        const cached = localStorage.getItem('updock_favorites_cache');
        return cached ? JSON.parse(cached) : [];
    });
    const { user } = useAuth();
    const { spots } = useSpots();

    // Fetch favorites when user connects
    useEffect(() => {
        if (!user) {
            setFavorites([]);
            return;
        }

        const fetchFavorites = async () => {
            const { data, error } = await supabase
                .from('favorites')
                .select('spot_id');

            if (error) {
                console.error('Error fetching favorites:', error);
                return;
            }

            if (data) {
                const favIds = data.map((row: any) => row.spot_id);
                setFavorites(favIds);
                localStorage.setItem('updock_favorites_cache', JSON.stringify(favIds));

                // Cache images for all favorites
                const favSpots = spots.filter(s => favIds.includes(s.id));
                favSpots.forEach(s => cacheSpotImages(s.image_urls));
            }
        };

        fetchFavorites();
    }, [user]);

    // Save to local storage whenever favorites change
    useEffect(() => {
        if (favorites.length > 0) {
            localStorage.setItem('updock_favorites_cache', JSON.stringify(favorites));
        }
    }, [favorites]);

    const toggleFavorite = async (spotId: string) => {
        if (!user) return;

        const isCurrentlyFavorite = favorites.includes(spotId);

        // Optimistic UI Update
        setFavorites(prev =>
            isCurrentlyFavorite
                ? prev.filter(id => id !== spotId)
                : [...prev, spotId]
        );

        try {
            if (isCurrentlyFavorite) {
                // Remove
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('spot_id', spotId)
                    .eq('user_id', user.id); // Redundant thanks to RLS but safer

                if (error) throw error;
            } else {
                // Add
                const { error } = await supabase
                    .from('favorites')
                    .insert([{ user_id: user.id, spot_id: spotId }]);

                if (error) throw error;

                // If added, cache images
                const spot = spots.find(s => s.id === spotId);
                if (spot) cacheSpotImages(spot.image_urls);
            }
        } catch (err) {
            console.error('Error updating favorites:', err);
            // Revert on error
            setFavorites(prev =>
                isCurrentlyFavorite
                    ? [...prev, spotId]
                    : prev.filter(id => id !== spotId)
            );
            // Propager l'echec apres le revert : le composant appelant affiche
            // le feedback traduit (t()) — le context n'a pas acces a i18n (Pitfall 4).
            throw err;
        }
    };

    const isFavorite = (spotId: string) => favorites.includes(spotId);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}
