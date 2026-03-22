import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'loading';

interface NotificationsContextType {
    permissionStatus: PermissionStatus;
    hasToken: boolean;
    ensurePushToken: () => Promise<void>;
    checkPermission: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
    const [hasToken, setHasToken] = useState(false);

    const checkPermission = useCallback(async () => {
        try {
            setPermissionStatus('loading');
            const { receive } = await FirebaseMessaging.checkPermissions();
            if (receive === 'granted') {
                setPermissionStatus('granted');
            } else if (receive === 'denied') {
                setPermissionStatus('denied');
            } else {
                setPermissionStatus('unknown');
            }
        } catch (error) {
            console.error('[Notifications] checkPermission error:', error);
            setPermissionStatus('unknown');
        }
    }, []);

    // Check permission on mount
    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    // Check if user already has a token in push_tokens
    useEffect(() => {
        if (!user) {
            setHasToken(false);
            return;
        }
        supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', user.id)
            .limit(1)
            .then(({ data, error }) => {
                if (error) {
                    console.error('[Notifications] hasToken check error:', error);
                    return;
                }
                setHasToken(!!(data && data.length > 0));
            });
    }, [user]);

    // Listen for token rotation
    useEffect(() => {
        if (!user) return;

        let listenerHandle: Awaited<ReturnType<typeof FirebaseMessaging.addListener>> | null = null;

        FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
            if (!user || !token) return;
            try {
                await supabase
                    .from('push_tokens')
                    .upsert(
                        { user_id: user.id, token, platform: 'ios' },
                        { onConflict: 'user_id,token' }
                    );
                setHasToken(true);
            } catch (error) {
                console.error('[Notifications] tokenReceived upsert error:', error);
            }
        }).then((handle) => {
            listenerHandle = handle;
        });

        return () => {
            listenerHandle?.remove();
        };
    }, [user]);

    const ensurePushToken = useCallback(async () => {
        try {
            if (!user) return;

            // Check if already registered for this user
            const { data: existing } = await supabase
                .from('push_tokens')
                .select('token')
                .eq('user_id', user.id)
                .limit(1);

            if (existing && existing.length > 0) {
                setHasToken(true);
                return;
            }

            // Request permission
            const { receive } = await FirebaseMessaging.requestPermissions();
            if (receive !== 'granted') {
                setPermissionStatus('denied');
                return;
            }

            // Get FCM token
            const { token } = await FirebaseMessaging.getToken();
            if (!token) return;

            // Upsert to push_tokens
            await supabase
                .from('push_tokens')
                .upsert(
                    { user_id: user.id, token, platform: 'ios' },
                    { onConflict: 'user_id,token' }
                );

            setPermissionStatus('granted');
            setHasToken(true);
        } catch (error) {
            console.error('[Notifications]', error);
        }
    }, [user]);

    return (
        <NotificationsContext.Provider value={{ permissionStatus, hasToken, ensurePushToken, checkPermission }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications(): NotificationsContextType {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
