import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { type Review } from './ReviewForm';

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
  currentUserId: string | undefined;
}

export default function ReviewList({ reviews, isLoading, currentUserId: _currentUserId }: ReviewListProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-center text-slate-400 text-sm py-8">{t('review.no_reviews')}</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review, index) => {
        const hasAvatar = !!review.profiles?.avatar_url;

        const displayName = review.profiles?.display_name || t('review.anonymous');

        return (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl p-4 border border-slate-100"
          >
            {/* Author row */}
            <div className="flex items-center gap-2 mb-2">
              {hasAvatar ? (
                <img
                  src={review.profiles!.avatar_url!}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <User size={16} className="text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                <p className="text-xs text-slate-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                />
              ))}
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-slate-600 mt-1">{review.comment}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
