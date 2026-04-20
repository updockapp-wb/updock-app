import { X, Heart, Wind, Waves, MapPin, ChevronLeft, ChevronRight, Share2, Star, MessageSquare, Calendar, Lock, Pencil, Save, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { type Spot, type StartType } from '../data/spots';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { createPortal } from 'react-dom';
import { Share } from '@capacitor/share';
import ReviewForm from './ReviewForm';
import { type Review } from './ReviewForm';
import ReviewList from './ReviewList';
import SessionForm from './SessionForm';
import SessionList from './SessionList';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { useSpots } from '../context/SpotsContext';
import { supabase } from '../lib/supabase';

interface SpotDetailProps {
    spot: Spot | null;
    onClose: () => void;
    onOpenAuth?: () => void;
}

export default function SpotDetail({ spot, onClose, onOpenAuth }: SpotDetailProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { sessions, isLoadingSessions, fetchSessionsForSpot } = useSessions();
    const sessionCount = sessions.length;
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [snap, setSnap] = useState<number | string | null>(0.35);
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    const [activeTab, setActiveTab] = useState<'info' | 'reviews' | 'sessions'>('info');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [userReview, setUserReview] = useState<Review | null>(null);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [avgRating, setAvgRating] = useState<number | null>(null);
    const [reviewCount, setReviewCount] = useState(0);
    const [uploaderProfile, setUploaderProfile] = useState<{
        display_name: string | null;
        avatar_url: string | null;
    } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Spot | null>(null);
    const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
    const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { updateSpot } = useSpots();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset state when spot changes
    useEffect(() => {
        if (spot) {
            setIsImageOpen(false);
            setCurrentPhotoIndex(0);
            setIsEditing(false);
            setUploaderProfile(null);
        }
    }, [spot]);

    // Reset reviews and fetch when spot changes
    useEffect(() => {
        if (!spot) return;
        // Reset tab to info when opening a new spot
        setActiveTab('info');
        // Reset stale reviews synchronously before async fetch (Pitfall 2)
        setReviews([]);
        setUserReview(null);
        setAvgRating(null);
        setReviewCount(0);

        fetchSessionsForSpot(spot.id);

        const fetchReviews = async () => {
            setIsLoadingReviews(true);
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('spot_id', spot.id)
                .order('created_at', { ascending: false });

            if (data && !error) {
                // Fetch profiles separately — no FK required
                const userIds = [...new Set(data.map(r => r.user_id))];
                const { data: profilesData } = userIds.length > 0
                    ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds)
                    : { data: [] };
                const profilesMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]));
                const reviewsWithProfiles = data.map(r => ({ ...r, profiles: profilesMap[r.user_id] || null }));

                setReviews(reviewsWithProfiles as Review[]);
                setUserReview((reviewsWithProfiles as Review[]).find(r => r.user_id === user?.id) ?? null);
                // Client-side avg calculation for immediate consistency
                if (data.length > 0) {
                    const sum = data.reduce((acc, r) => acc + r.rating, 0);
                    setAvgRating(Math.round((sum / data.length) * 10) / 10);
                    setReviewCount(data.length);
                }
            }
            setIsLoadingReviews(false);
        };

        fetchReviews();
    }, [spot?.id, user?.id]);

    // Fetch uploader profile
    useEffect(() => {
        if (!spot?.user_id) {
            setUploaderProfile(null);
            return;
        }
        supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', spot.user_id)
            .single()
            .then(({ data }) => setUploaderProfile(data));
    }, [spot?.id]);

    const handleReviewSubmit = (review: Review) => {
        setReviews(prev => {
            const filtered = prev.filter(r => r.user_id !== review.user_id);
            const updated = [review, ...filtered];
            // Recalculate avg immediately (Pitfall 4 — success criterion 4)
            const sum = updated.reduce((acc, r) => acc + r.rating, 0);
            setAvgRating(Math.round((sum / updated.length) * 10) / 10);
            setReviewCount(updated.length);
            return updated;
        });
        setUserReview(review);
    };

    const handleReviewDelete = () => {
        setReviews(prev => {
            const filtered = prev.filter(r => r.user_id !== user?.id);
            // Recalculate avg immediately
            if (filtered.length > 0) {
                const sum = filtered.reduce((acc, r) => acc + r.rating, 0);
                setAvgRating(Math.round((sum / filtered.length) * 10) / 10);
            } else {
                setAvgRating(null);
            }
            setReviewCount(filtered.length);
            return filtered;
        });
        setUserReview(null);
    };

    if (!spot) return null;

    const handleShare = async () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${spot.position[0]},${spot.position[1]}`;
        const title = `Updock - ${spot.name}`;
        const text = `${spot.name} (${spot.type.join(', ')}). ${language === 'fr' && spot.description_fr ? spot.description_fr : spot.description}`;

        try {
            await Share.share({
                title,
                text,
                url,
                dialogTitle: t('spot.share_title') || 'Share this spot',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleSaveEdit = async () => {
        if (!editForm) return;
        setIsSaving(true);
        try {
            // 1. Upload new photos to Supabase Storage
            const newUrls: string[] = [];
            for (const file of newPhotoFiles) {
                const ext = file.name.split('.').pop();
                const path = `public/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('spots').upload(path, file);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('spots').getPublicUrl(path);
                    newUrls.push(publicUrl);
                }
            }

            // 2. Compute final image_urls: existing minus deleted, plus new
            const existingUrls = (editForm.image_urls || []).filter(url => !photosToDelete.includes(url));
            const finalUrls = [...existingUrls, ...newUrls];

            // 3. Update spot via context
            await updateSpot({ ...editForm, image_urls: finalUrls.length > 0 ? finalUrls : undefined });

            // 4. Close overlay and reset
            setIsEditing(false);
            setEditForm(null);
            setNewPhotoFiles([]);
            setPhotosToDelete([]);
        } catch (error) {
            console.error('Error saving spot edit:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const content = (
        <div className="flex flex-col h-full bg-white md:rounded-[24px] relative">
            {/* Header Area */}
            <div className="w-full pt-6 pb-4 px-6 shrink-0">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <motion.h2
                                layoutId={`spot-name-${spot.id}`}
                                className="text-2xl font-bold text-slate-900"
                            >
                                {spot.name}
                            </motion.h2>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${spot.type.includes('Dockstart') ? 'bg-sky-100 text-sky-700' :
                                spot.type.includes('Rockstart') ? 'bg-pink-100 text-pink-700' :
                                    'bg-teal-100 text-teal-700'
                                }`}>
                                {spot.type.join(' • ')}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <MapPin size={14} />
                            <span>{spot.position[0].toFixed(4)}, {spot.position[1].toFixed(4)}</span>
                        </div>
                        {spot?.user_id && uploaderProfile && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                                <span>{t('spot.added_by')}</span>
                                {uploaderProfile.avatar_url ? (
                                    <img src={uploaderProfile.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                        <UserIcon size={10} className="text-slate-400" />
                                    </div>
                                )}
                                <span className="text-slate-500">{uploaderProfile.display_name || t('review.anonymous')}</span>
                                {(user?.id === spot.user_id || user?.email === 'updock.app@gmail.com') && (
                                    <>
                                        <span className="text-slate-300">·</span>
                                        <button
                                            onClick={() => {
                                                setEditForm(spot ? { ...spot } : null);
                                                setNewPhotoFiles([]);
                                                setPhotosToDelete([]);
                                                setIsEditing(true);
                                            }}
                                            className="text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1"
                                        >
                                            <Pencil size={12} />
                                            {t('spot.edit')}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare();
                            }}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm"
                            title={t('spot.share')}
                        >
                            <Share2 size={20} className="text-slate-600" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                    onOpenAuth?.();
                                    return;
                                }
                                toggleFavorite(spot.id);
                            }}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm relative overflow-visible"
                        >
                            <Heart
                                size={20}
                                className={user && isFavorite(spot.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}
                            />
                            {!user && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white rounded-full border border-slate-200 flex items-center justify-center">
                                    <Lock size={10} className="text-slate-400" />
                                </span>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Button */}
            <div className="px-6 pb-4">
                <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.position[0]},${spot.position[1]}`, '_blank')}
                    className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <MapPin size={18} />
                    {t('spot.navigate')}
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-12">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 text-sm font-bold rounded-full transition-colors ${
                            activeTab === 'info'
                                ? 'bg-sky-100 text-sky-700'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {t('spot.tab_info')}
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`px-4 py-2 text-sm font-bold rounded-full transition-colors flex items-center gap-1.5 ${
                            activeTab === 'reviews'
                                ? 'bg-sky-100 text-sky-700'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <MessageSquare size={14} />
                        {t('spot.tab_reviews')}
                        {reviewCount > 0 && (
                            <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                                {reviewCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`flex items-center gap-1 text-sm font-bold rounded-full px-4 py-2 transition-colors ${
                            activeTab === 'sessions'
                                ? 'bg-sky-100 text-sky-700'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Calendar size={14} />
                        {t('spot.tab_sessions')}
                        {sessionCount > 0 && (
                            <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{sessionCount}</span>
                        )}
                    </button>
                </div>

                {activeTab === 'info' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <div className="text-sky-500 mb-1"><Wind size={18} /></div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('spot.difficulty')}</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{spot.difficulty}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <div className="text-teal-500 mb-1"><Waves size={18} /></div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('spot.height')}</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{spot.height || '-'}m</p>
                            </div>
                        </div>

                        {/* Photo Preview */}
                        <div className="mb-6">
                            <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                                📷 Photos
                            </h3>
                            <div
                                className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 relative cursor-pointer hover:opacity-90 transition-opacity border border-slate-100"
                                onClick={() => {
                                    if (!user) {
                                        onOpenAuth?.();
                                        return;
                                    }
                                    if (spot.image_urls && spot.image_urls.length > 0) {
                                        setCurrentPhotoIndex(0);
                                        setIsImageOpen(true);
                                    }
                                }}
                            >
                                {spot.image_urls && spot.image_urls.length > 0 ? (
                                    <>
                                        <img
                                            src={spot.image_urls[0]}
                                            alt={spot.name}
                                            className={`w-full h-full object-cover transition-all duration-300 ${!user ? 'blur-sm scale-105' : ''}`}
                                        />
                                        {/* Overlay cadenas — seulement si non connecté */}
                                        {!user && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                <div className="bg-white/70 backdrop-blur-sm rounded-full p-2.5 shadow">
                                                    <Lock size={16} className="text-slate-600" />
                                                </div>
                                            </div>
                                        )}
                                        {/* Badge "N photos" — seulement si connecté ET plusieurs photos */}
                                        {user && spot.image_urls.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">
                                                View {spot.image_urls.length} Photos
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                                        <div className="p-3 bg-white rounded-full"><Waves size={24} className="opacity-20" /></div>
                                        No photos available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider opacity-60">{t('spot.desc')}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                {language === 'fr' && spot.description_fr ? spot.description_fr : spot.description}
                            </p>
                        </div>
                    </>
                )}

                {activeTab === 'reviews' && (
                    <div>
                        {/* Average Rating Summary */}
                        {avgRating !== null && (
                            <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl p-4 border border-slate-100">
                                <div className="text-3xl font-bold text-slate-900">{avgRating}</div>
                                <div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <Star
                                                key={v}
                                                size={16}
                                                className={v <= Math.round(avgRating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-200'}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {reviewCount} {t('review.stars')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Review Form */}
                        {user ? (
                            <div className="mb-6">
                                <ReviewForm
                                    spotId={spot.id}
                                    userReview={userReview}
                                    onSubmit={handleReviewSubmit}
                                    onDelete={handleReviewDelete}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => onOpenAuth?.()}
                                className="w-full mb-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                            >
                                {t('review.write')}
                                <Lock size={14} className="text-slate-400" />
                            </button>
                        )}

                        {/* Review List */}
                        <ReviewList
                            reviews={reviews.filter(r => r.user_id !== user?.id)}
                            isLoading={isLoadingReviews}
                            currentUserId={user?.id}
                        />
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div>
                        {user ? (
                            <SessionForm
                                spotId={spot.id}
                                onSessionCreated={() => fetchSessionsForSpot(spot.id)}
                            />
                        ) : (
                            <button
                                onClick={() => onOpenAuth?.()}
                                className="w-full mb-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                            >
                                {t('session.create')}
                                <Lock size={14} className="text-slate-400" />
                            </button>
                        )}
                        <div className="mt-4">
                            <SessionList sessions={sessions} isLoading={isLoadingSessions} />
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Overlay */}
            <AnimatePresence>
                {isEditing && editForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-white z-50 p-6 flex flex-col overflow-hidden rounded-[24px]"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800">{t('spot.edit_title')}</h3>
                            <button onClick={() => { setIsEditing(false); setEditForm(null); }} className="p-2 bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('spot.edit_name')}</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            {/* Type multi-select */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('spot.edit_type')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['Dockstart', 'Rockstart', 'Dropstart', 'Deadstart', 'Rampstart'] as StartType[]).map(tp => (
                                        <button
                                            key={tp}
                                            onClick={() => {
                                                const newTypes = editForm.type.includes(tp)
                                                    ? editForm.type.filter(x => x !== tp)
                                                    : [...editForm.type, tp];
                                                if (newTypes.length > 0) setEditForm({ ...editForm, type: newTypes });
                                            }}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all flex-grow
                                                ${editForm.type.includes(tp)
                                                    ? 'border-sky-500 bg-sky-50 text-sky-600'
                                                    : 'border-slate-100 bg-white text-slate-400'}`}
                                        >
                                            {tp}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('spot.edit_description')}</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none min-h-[80px]"
                                />
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('spot.edit_difficulty')}</label>
                                <div className="flex gap-1">
                                    {(['Easy', 'Medium', 'Hard', 'Extreme'] as const).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setEditForm({ ...editForm, difficulty: d })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${editForm.difficulty === d ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Photos */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('spot.edit_photos')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Existing photos (minus those marked for deletion) */}
                                    {(editForm.image_urls || []).filter(url => !photosToDelete.includes(url)).map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                            <button
                                                onClick={() => setPhotosToDelete(prev => [...prev, url])}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {/* New photo previews */}
                                    {newPhotoFiles.map((file, i) => (
                                        <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden">
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                                            <button
                                                onClick={() => setNewPhotoFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {/* Add photo button — only show if total photos < 5 */}
                                    {((editForm.image_urls || []).filter(url => !photosToDelete.includes(url)).length + newPhotoFiles.length) < 5 && (
                                        <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-sky-400 transition-colors">
                                            <Plus size={24} className="text-slate-300" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setNewPhotoFiles(prev => [...prev, file]);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Save button */}
                        <div className="pt-4 border-t border-slate-100 mt-4">
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="w-full bg-sky-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isSaving ? '...' : t('spot.edit_save')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // Lightbox JSX — rendered inside Drawer.Portal on mobile (so it is part of the
    // Radix Dialog portal tree and not marked aria-hidden by hideOthers()), and via
    // createPortal to document.body on desktop (no Drawer active, no aria-hiding issue).
    const lightbox = (
        <AnimatePresence>
            {isImageOpen && spot?.image_urls && spot.image_urls.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
                    onClick={() => setIsImageOpen(false)}
                    onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setIsImageOpen(false); } }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsImageOpen(false); }}
                        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setIsImageOpen(false); }}
                        className="absolute top-6 right-6 p-4 min-w-[44px] min-h-[44px] bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                    >
                        <X size={24} className="text-white" />
                    </button>

                    <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase border border-white/10">
                        {currentPhotoIndex + 1} / {spot.image_urls.length}
                    </div>

                    {spot.image_urls.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : spot.image_urls!.length - 1);
                                }}
                                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : spot.image_urls!.length - 1); }}
                                className="absolute left-6 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                            >
                                <ChevronLeft size={32} className="text-white" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPhotoIndex(prev => prev < spot.image_urls!.length - 1 ? prev + 1 : 0);
                                }}
                                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentPhotoIndex(prev => prev < spot.image_urls!.length - 1 ? prev + 1 : 0); }}
                                className="absolute right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                            >
                                <ChevronRight size={32} className="text-white" />
                            </button>
                        </>
                    )}

                    <motion.img
                        key={currentPhotoIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        src={spot.image_urls[currentPhotoIndex]}
                        alt={`${spot.name} - Photo ${currentPhotoIndex + 1}`}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <div className="hidden md:block absolute left-4 top-4 bottom-4 w-[400px] z-[1050]">
                <motion.div
                    className="h-full rounded-[24px] shadow-2xl overflow-hidden border border-slate-200"
                    initial={{ x: '-105%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-105%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    {content}
                </motion.div>
            </div>

            {/* MOBILE DRAWER (Vaul) */}
            <div className="md:hidden">
                <Drawer.Root
                    open={!!spot && isMobile}
                    onClose={onClose}
                    snapPoints={[0.35, 0.95]}
                    activeSnapPoint={snap}
                    setActiveSnapPoint={setSnap}
                    shouldScaleBackground
                    modal={false}
                >
                    <Drawer.Portal>
                        <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] h-full fixed bottom-0 left-0 right-0 z-[2001] outline-none shadow-2xl md:hidden">
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mt-3 mb-2" />
                            <div className="flex-1 overflow-hidden">
                                {content}
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            </div>

            {mounted && createPortal(lightbox, document.body)}
        </>
    );
}
