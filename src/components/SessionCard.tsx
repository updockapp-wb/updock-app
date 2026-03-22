import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSessions, type Session } from '../context/SessionsContext';
import { useNotifications } from '../context/NotificationsContext';

const AVATARS = [
  { id: 1, src: '/src/assets/avatars/avatar1.svg', name: 'Wave Rider' },
  { id: 2, src: '/src/assets/avatars/avatar2.svg', name: 'Wind Sail' },
  { id: 3, src: '/src/assets/avatars/avatar3.svg', name: 'Sea Sun' },
  { id: 4, src: '/src/assets/avatars/avatar4.svg', name: 'Deep Fin' },
  { id: 5, src: '/src/assets/avatars/avatar5.svg', name: 'Anchor Point' },
];

interface SessionCardProps {
  session: Session;
  index: number;
}

export default function SessionCard({ session, index }: SessionCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { joinSession, leaveSession, cancelSession } = useSessions();
  const { hasToken, permissionStatus } = useNotifications();
  const showPermissionBanner = !hasToken && permissionStatus !== 'granted';

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isCreator = session.creator_id === user?.id;
  const canJoin = !!user && !session.user_is_attending && !isCreator;
  const canLeave = !!user && session.user_is_attending && !isCreator;

  const avatarSrc =
    session.creator_profile?.avatar_url ||
    AVATARS.find((a) => a.id === (session.creator_profile?.avatar_id ?? 1))?.src ||
    AVATARS[0].src;

  const date = new Date(session.starts_at);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isToday = date.getTime() - Date.now() < 24 * 60 * 60 * 1000 && date.getTime() > Date.now();

  const handleJoin = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      await joinSession(session.id);
    } catch {
      setActionError(t('session.join_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      await leaveSession(session.id);
    } catch {
      setActionError(t('session.leave_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      await cancelSession(session.id);
    } catch {
      setActionError(t('session.cancel_error'));
    } finally {
      setIsActionLoading(false);
      setIsConfirmingCancel(false);
    }
  };

  return (
    <motion.div
      key={session.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl p-4 border border-slate-100"
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <img
          src={avatarSrc}
          alt={session.creator_profile?.display_name || t('review.anonymous')}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="text-sm font-bold text-slate-800 truncate">
          {session.creator_profile?.display_name || t('review.anonymous')}
        </span>
        {isCreator && (
          <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase">
            {t('session.your_session')}
          </span>
        )}
      </div>

      {/* Session time row */}
      <div className="flex items-center gap-2 mt-1">
        <Calendar size={14} className="text-sky-500" />
        <span className="text-sm font-bold text-slate-800">
          {dateStr} {timeStr}
        </span>
        {isToday && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Today
          </span>
        )}
      </div>

      {/* Participant count */}
      <div className="flex items-center gap-1 mt-1">
        <Users size={14} className="text-slate-400" />
        <span className="text-xs text-slate-500">
          {session.attendee_count} {t('session.participants')}
        </span>
      </div>

      {/* Note */}
      {session.note && (
        <p className="text-sm text-slate-600 mt-1">{session.note}</p>
      )}

      {/* Permission banner — shown near join button for users without push token */}
      {showPermissionBanner && !session.user_is_attending && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          role="status"
          className="bg-sky-50 rounded-xl p-3 flex items-start gap-2 mt-3"
        >
          <Bell size={16} className="text-sky-500 mt-0.5 shrink-0" />
          <span className="text-sm text-sky-700">{t('notification.banner')}</span>
        </motion.div>
      )}

      {/* Action row */}
      <AnimatePresence mode="wait">
        {canJoin && (
          <button
            onClick={handleJoin}
            disabled={isActionLoading}
            className="w-full border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-xl py-2 text-sm font-bold min-h-[44px] mt-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            {t('session.join')}
          </button>
        )}
        {canLeave && (
          <button
            onClick={handleLeave}
            disabled={isActionLoading}
            className="w-full border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl py-2 text-sm font-bold min-h-[44px] mt-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            {t('session.leave')}
          </button>
        )}
        {isCreator && !isConfirmingCancel && (
          <button
            onClick={() => setIsConfirmingCancel(true)}
            className="w-full border border-red-200 text-red-500 hover:bg-red-50 rounded-xl py-2 text-sm font-bold min-h-[44px] mt-3"
          >
            {t('session.cancel')}
          </button>
        )}
        {isCreator && isConfirmingCancel && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-slate-600 flex-1">{t('session.cancel_confirm')}</span>
            <button
              onClick={handleCancel}
              disabled={isActionLoading}
              className="text-red-500 border border-red-200 rounded-xl py-1.5 px-4 text-sm font-bold hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              {t('session.cancel_confirm_yes')}
            </button>
            <button
              onClick={() => setIsConfirmingCancel(false)}
              className="text-slate-500 border border-slate-200 rounded-xl py-1.5 px-4 text-sm font-bold hover:bg-slate-50"
            >
              {t('session.cancel_confirm_no')}
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Action error */}
      {actionError && <p className="text-red-500 text-sm mt-1">{actionError}</p>}
    </motion.div>
  );
}
