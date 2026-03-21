import { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export interface Review {
  id: string;
  spot_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    avatar_id: number | null;
  } | null;
}

interface ReviewFormProps {
  spotId: string;
  userReview: Review | null;
  onSubmit: (review: Review) => void;
  onDelete: () => void;
}

export default function ReviewForm({ spotId, userReview, onSubmit, onDelete }: ReviewFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || '');
      setIsEditing(true);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    const { data, error: submitError } = await supabase
      .from('reviews')
      .upsert(
        {
          spot_id: spotId,
          user_id: user.id,
          rating,
          comment,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'spot_id,user_id' }
      )
      .select('*, profiles(display_name, avatar_url, avatar_id)')
      .single();

    if (submitError) {
      setError(submitError.message);
    } else if (data) {
      onSubmit(data as Review);
      setIsEditing(false);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!user) return;
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('spot_id', spotId)
      .eq('user_id', user.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      onDelete();
    }
  };

  // Show read-only summary with edit/delete controls when user has a review and is not editing
  if (userReview && !isEditing) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {t('review.your_review')}
        </p>
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={star <= userReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
            />
          ))}
        </div>
        {userReview.comment && (
          <p className="text-sm text-slate-600 mt-1">{userReview.comment}</p>
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEditClick}
            className="flex-1 py-2 text-sm font-semibold text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-50 transition-colors"
          >
            {t('review.edit')}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            {t('review.delete')}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    );
  }

  // Show the form (new review or editing)
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      {/* Star picker */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="transition-transform active:scale-90"
          >
            <Star
              size={28}
              className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'}
            />
          </button>
        ))}
      </div>

      {/* Comment textarea */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        minLength={20}
        placeholder={t('review.placeholder')}
        rows={4}
        className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white"
      />

      {/* Character count */}
      <p className="text-xs text-slate-400 text-right mt-1">{comment.length}/1000</p>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || comment.trim().length < 20 || isSubmitting}
        className="w-full py-3 mt-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
      >
        {isEditing ? t('review.update') : t('review.submit')}
      </button>

      {/* Inline error */}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
