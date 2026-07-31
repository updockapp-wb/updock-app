import { createContext, useContext } from 'react';
import type { SessionsContextType } from './SessionsContext';

export const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

export function useSessions() {
    const context = useContext(SessionsContext);
    if (context === undefined) {
        throw new Error('useSessions must be used within a SessionsProvider');
    }
    return context;
}
