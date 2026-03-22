import { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSessions } from '../context/SessionsContext';
import { useNotifications } from '../context/NotificationsContext';

interface SessionFormProps {
  spotId: string;
  onSessionCreated: () => void;
}

export default function SessionForm({ spotId, onSessionCreated }: SessionFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { createSession } = useSessions();

  const { hasToken, permissionStatus } = useNotifications();
  const showPermissionBanner = !hasToken && permissionStatus !== 'granted';

  const [startsAt, setStartsAt] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        onChange={(e) => setStartsAt(e.target.value)}
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
