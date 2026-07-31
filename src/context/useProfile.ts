import { createContext, useContext } from 'react';
import type { ProfileContextType } from './ProfileContext';

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
