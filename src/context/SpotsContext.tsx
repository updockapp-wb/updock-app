import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { spots as staticSpots, type Spot, type StartType } from '../data/spots';
import { supabase } from '../lib/supabase';

// We rely on the Spot type from data/spots.ts having is_approved?
// If not, we extend it here or update data/spots.ts (which I did in step 1384).

interface SpotsContextType {
    spots: Spot[];
    loading: boolean;
    addSpot: (spot: Omit<Spot, 'id' | 'user_id'>, imageFiles?: File[]) => Promise<void>;
    approveSpot: (id: string) => Promise<void>;
    deleteSpot: (id: string) => Promise<void>;
    updateSpot: (spot: Spot) => Promise<void>;
}

const SpotsContext = createContext<SpotsContextType | undefined>(undefined);

export function SpotsProvider({ children }: { children: ReactNode }) {
    // Start with static spots (assumed approved)
    const [spots, setSpots] = useState<Spot[]>(
        staticSpots.map(s => ({ ...s, is_approved: true }))
    );
    const [loading, setLoading] = useState(true);

    // Fetch spots from Supabase
    useEffect(() => {
        fetchSpots();
    }, []);

    const fetchSpots = async () => {
        try {
            const { data, error } = await supabase
                .from('spots')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Map DB spots
                const dbSpots: Spot[] = data.map((s: any) => {
                    let spotType: StartType[] = ['Dockstart'];

                    if (Array.isArray(s.type)) {
                        spotType = s.type;
                    } else if (typeof s.type === 'string') {
                        // Check if it's a JSON array string
                        try {
                            const parsed = JSON.parse(s.type);
                            if (Array.isArray(parsed)) {
                                spotType = parsed;
                            } else {
                                spotType = [s.type as StartType];
                            }
                        } catch {
                            spotType = [s.type as StartType];
                        }
                    }

                    return {
                        id: s.id,
                        name: s.name,
                        type: spotType,
                        position: [s.lat, s.lng],
                        description: s.description,
                        difficulty: s.difficulty as any,
                        height: s.height,
                        image_urls: s.image_urls,
                        is_approved: s.is_approved
                    };
                });

                // Merge
                setSpots([...staticSpots.map(s => ({ ...s, is_approved: true })), ...dbSpots]);
            }
        } catch (error) {
            console.error('Error fetching spots:', error);
        } finally {
            setLoading(false);
        }
    };

    const addSpot = async (newSpotData: Omit<Spot, 'id'>, imageFiles?: File[]) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in.');
                return;
            }

            const imageUrls: string[] = [];

            // Upload Images if present (up to 5)
            if (imageFiles && imageFiles.length > 0) {
                const filesToUpload = imageFiles.slice(0, 5); // Limit to 5

                for (const imageFile of filesToUpload) {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `public/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('spots')
                        .upload(filePath, imageFile);

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        alert(`Image upload failed: ${uploadError.message}`);
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('spots')
                            .getPublicUrl(filePath);
                        imageUrls.push(publicUrl);
                    }
                }
            }

            const dbPayload = {
                name: newSpotData.name,
                description: newSpotData.description,
                type: JSON.stringify(newSpotData.type),
                lat: newSpotData.position[0],
                lng: newSpotData.position[1],
                difficulty: newSpotData.difficulty,
                height: newSpotData.height,
                image_urls: imageUrls.length > 0 ? imageUrls : null,
                user_id: user.id
            };

            const { data, error } = await supabase.from('spots').insert([dbPayload]).select().single();
            if (error) throw error;

            if (data) {
                let spotType: StartType[] = ['Dockstart'];
                try {
                    const parsed = typeof data.type === 'string' ? JSON.parse(data.type) : data.type;
                    spotType = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    spotType = [data.type as StartType];
                }

                const createdSpot: Spot = {
                    id: data.id,
                    name: data.name,
                    type: spotType,
                    position: [data.lat, data.lng],
                    description: data.description,
                    difficulty: data.difficulty as any,
                    height: data.height,
                    image_urls: data.image_urls,
                    is_approved: data.is_approved
                };
                setSpots(prev => [createdSpot, ...prev]);
                alert('Spot submitted! It will appear once approved by an admin.');
            }
        } catch (error: any) {
            console.error('Error adding spot:', error);
            alert(`Failed to add spot: ${error.message || error.details || JSON.stringify(error)}`);
        }
    };

    const approveSpot = async (id: string) => {
        try {
            const { error } = await supabase.from('spots').update({ is_approved: true }).eq('id', id);
            if (error) throw error;
            setSpots(prev => prev.map(s => s.id === id ? { ...s, is_approved: true } : s));
        } catch (error) {
            console.error('Error approving:', error);
            alert('Failed to approve.');
        }
    };

    const deleteSpot = async (id: string) => {
        if (!confirm('Delete this spot?')) return;

        // Handle static spots (local only)
        if (id.startsWith('fr-') || id.startsWith('ch-') || id.startsWith('es-')) {
            setSpots(prev => prev.filter(s => s.id !== id));
            return;
        }

        try {
            // 1. Delete associated favorites first to avoid FK constraint issues
            const { error: favError } = await supabase
                .from('favorites')
                .delete()
                .eq('spot_id', id);

            if (favError) {
                console.warn('Could not delete favorites, proceeding anyway:', favError);
            }

            // 2. Delete the spot itself
            const { error } = await supabase.from('spots').delete().eq('id', id);
            if (error) throw error;

            setSpots(prev => prev.filter(s => s.id !== id));
        } catch (error: any) {
            console.error('Error deleting spot:', error);
            const errorMessage = error.message || error.error_description || 'Unknown error';
            alert(`[DEBUG] Failed to delete spot: ${errorMessage}`);
        }
    };

    const updateSpot = async (updatedSpot: Spot) => {
        try {
            const { error } = await supabase
                .from('spots')
                .update({
                    name: updatedSpot.name,
                    description: updatedSpot.description,
                    type: JSON.stringify(updatedSpot.type), // Use JSON string
                    // lat/lng could also be updated if we added dragndrop, but for now we assume simple text edits
                    difficulty: updatedSpot.difficulty,
                })
                .eq('id', updatedSpot.id);

            if (error) throw error;

            setSpots(prev => prev.map(s => s.id === updatedSpot.id ? updatedSpot : s));
        } catch (error) {
            console.error('Error updating spot:', error);
            alert('Failed to update spot.');
        }
    };

    return (
        <SpotsContext.Provider value={{ spots, loading, addSpot, approveSpot, deleteSpot, updateSpot }}>
            {children}
        </SpotsContext.Provider>
    );
}

export function useSpots() {
    const context = useContext(SpotsContext);
    if (context === undefined) {
        throw new Error('useSpots must be used within a SpotsProvider');
    }
    return context;
}
