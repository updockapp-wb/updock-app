import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { type Review } from './ReviewForm';

const AVATARS = [
    { id: 1, src: '/src/assets/avatars/avatar1.svg', name: 'Wave Rider' },
    { id: 2, src: '/src/assets/avatars/avatar2.svg', name: 'Wind Sail' },
    { id: 3, src: '/src/assets/avatars/avatar3.svg', name: 'Sea Sun' },
    { id: 4, src: '/src/assets/avatars/avatar4.svg', name: 'Deep Fin' },
    { id: 5, src: '/src/assets/avatars/avatar5.svg', name: 'Anchor Point' },
];

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
        const avatarSrc =
          review.profiles?.avatar_url ||
          AVATARS.find((a) => a.id === (review.profiles?.avatar_id || 1))?.src ||
          AVATARS[0].src;

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
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
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
