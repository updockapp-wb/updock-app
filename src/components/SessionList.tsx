import { AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { type Session } from '../context/SessionsContext';
import SessionCard from './SessionCard';

interface SessionListProps {
  sessions: Session[];
  isLoading: boolean;
}

export default function SessionList({ sessions, isLoading }: SessionListProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-center text-slate-400 text-sm py-8">{t('session.no_sessions')}</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {sessions.map((session, index) => (
          <SessionCard key={session.id} session={session} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
}
