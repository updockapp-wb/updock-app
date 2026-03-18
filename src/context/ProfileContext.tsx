import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProfileData {
    display_name: string | null;
    avatar_url: string | null;
    avatar_id: number;
}

interface ProfileContextType {
    profile: ProfileData | null;
    isLoading: boolean;
    updateDisplayName: (name: string) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    selectPresetAvatar: (avatarId: number) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    // Fetch profile whenever user changes
    useEffect(() => {
        if (!user) {
            setProfile(null);
            return;
        }

        const fetchProfile = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, avatar_id')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                setProfile({
                    display_name: data.display_name ?? null,
                    avatar_url: data.avatar_url ?? null,
                    avatar_id: data.avatar_id ?? 1,
                });
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, [user]);

    const updateDisplayName = async (name: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, display_name: name });

        if (error) {
            console.error('Error updating display name:', error);
            throw error;
        }

        // Optimistic update
        setProfile(prev => prev ? { ...prev, display_name: name } : prev);
    };

    const uploadAvatar = async (file: File) => {
        if (!user) return;

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        const { error: dbError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, avatar_url: publicUrl });

        if (dbError) {
            console.error('Error saving avatar URL:', dbError);
            throw dbError;
        }

        // Update local profile state with new avatar_url
        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
    };

    const selectPresetAvatar = async (avatarId: number) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, avatar_id: avatarId, avatar_url: null });

        if (error) {
            console.error('Error selecting preset avatar:', error);
            throw error;
        }

        // Clear avatar_url when switching to preset
        setProfile(prev => prev ? { ...prev, avatar_id: avatarId, avatar_url: null } : prev);
    };

    return (
        <ProfileContext.Provider value={{ profile, isLoading, updateDisplayName, uploadAvatar, selectPresetAvatar }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
