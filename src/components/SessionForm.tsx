import { useState } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/useLanguage';
import { useSessions } from '../context/useSessions';
import { type Session } from '../context/SessionsContext';
import { useNotifications } from '../context/useNotifications';

interface SessionFormProps {
  spotId: string;
  onSessionCreated: () => void;
}

export default function SessionForm({ spotId, onSessionCreated }: SessionFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { createSession, checkSessionConflict, joinSession } = useSessions();

  const { hasToken, permissionStatus } = useNotifications();
  const showPermissionBanner = !hasToken && permissionStatus !== 'granted';

  const [startsAt, setStartsAt] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictSession, setConflictSession] = useState<Session | null>(null);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!startsAt) return;

    if (new Date(startsAt) <= new Date()) {
      setError(t('session.past_date_error'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isoDate = new Date(startsAt).toISOString();

      // Check for same-day conflict
      const conflict = await checkSessionConflict(spotId, isoDate);
      if (conflict) {
        setConflictSession(conflict);
        setIsSubmitting(false);
        return;
      }

      await createSession(spotId, isoDate, note);
      setStartsAt('');
      setNote('');
      onSessionCreated();
    } catch {
      setError(t('session.create_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
        {t('session.create')}
      </p>

      <label className="text-sm font-bold text-slate-800 mb-1 block">
        {t('session.date_label')}
      </label>
      <input
        type="datetime-local"
        value={startsAt}
        onChange={(e) => { setStartsAt(e.target.value); setConflictSession(null); }}
        min={new Date().toISOString().slice(0, 16)}
        required
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('session.note_placeholder')}
        maxLength={500}
        rows={3}
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 mt-3 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
      />

      <button
        onClick={handleSubmit}
        disabled={!startsAt || isSubmitting}
        className="w-full py-3 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 active:bg-sky-700 transition-colors min-h-[44px] mt-3 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          t('session.submit')
        )}
      </button>

      {conflictSession && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3"
        >
          <div className="flex items-start gap-2 mb-3">
            <Calendar size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">{t('session.conflict_message')}</p>
              <p className="text-xs text-amber-600 mt-1">
                {conflictSession.creator_profile?.display_name ?? '?'} — {new Date(conflictSession.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await joinSession(conflictSession.id);
                setConflictSession(null);
                onSessionCreated();
              }}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition-colors"
            >
              {t('session.conflict_join')}
            </button>
            <button
              onClick={async () => {
                setConflictSession(null);
                const isoDate = new Date(startsAt).toISOString();
                setIsSubmitting(true);
                try {
                  await createSession(spotId, isoDate, note);
                  setStartsAt('');
                  setNote('');
                  onSessionCreated();
                } catch {
                  setError(t('session.create_error'));
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              {t('session.conflict_create_anyway')}
            </button>
          </div>
        </motion.div>
      )}

      {showPermissionBanner && (
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

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
