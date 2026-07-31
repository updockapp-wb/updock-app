import { createContext, useContext } from 'react';
import type { FavoritesContextType } from './FavoritesContext';

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
