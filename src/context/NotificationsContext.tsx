import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { NotificationsContext } from './useNotifications';

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'loading';

export interface NotificationsContextType {
    permissionStatus: PermissionStatus;
    hasToken: boolean;
    ensurePushToken: () => Promise<void>;
    checkPermission: () => Promise<void>;
}

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
        // checkPermission() synchronise l'état de permission avec l'API native au montage ;
        // sa mise à jour synchrone de permissionStatus est volontaire (comportement validé recette).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkPermission();
    }, [checkPermission]);

    // Register push token automatically when user logs in
    useEffect(() => {
        if (!user) {
            // Reset au logout : on efface le flag token quand l'utilisateur se déconnecte
            // (comportement de sécurité T-05-01 validé par la recette — ne pas retirer).
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasToken(false);
            return;
        }
        supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', user.id)
            .limit(1)
            .then(async ({ data, error }) => {
                if (error) {
                    console.error('[Notifications] hasToken check error:', error);
                    return;
                }
                if (data && data.length > 0) {
                    setHasToken(true);
                    return;
                }
                try {
                    const { receive } = await FirebaseMessaging.requestPermissions();
                    if (receive !== 'granted') return;
                    const { token } = await FirebaseMessaging.getToken();
                    if (!token) return;
                    await supabase
                        .from('push_tokens')
                        .upsert(
                            { user_id: user.id, token, platform: 'ios' },
                            { onConflict: 'user_id,token' }
                        );
                    setPermissionStatus('granted');
                    setHasToken(true);
                } catch (err) {
                    console.error('[Notifications] auto-register error:', err);
                }
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
