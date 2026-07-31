import { createContext, useContext } from 'react';
import type { SpotsContextType } from './SpotsContext';

export const SpotsContext = createContext<SpotsContextType | undefined>(undefined);

export function useSpots() {
    const context = useContext(SpotsContext);
    if (context === undefined) {
        throw new Error('useSpots must be used within a SpotsProvider');
    }
    return context;
}
