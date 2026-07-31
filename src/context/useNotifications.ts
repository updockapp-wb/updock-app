import { createContext, useContext } from 'react';
import type { NotificationsContextType } from './NotificationsContext';

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function useNotifications(): NotificationsContextType {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
