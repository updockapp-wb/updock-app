import { createContext, useContext, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

export interface Session {
  id: string;
  spot_id: string;
  creator_id: string;
  starts_at: string;
  note: string | null;
  is_cancelled: boolean;
  created_at: string;
  creator_profile: {
    display_name: string | null;
    avatar_url: string | null;
    avatar_id: number | null;
  } | null;
  attendee_count: number;
  user_is_attending: boolean;
}

interface SessionsContextType {
  sessions: Session[];
  isLoadingSessions: boolean;
  fetchSessionsForSpot: (spotId: string) => Promise<void>;
  createSession: (spotId: string, startsAt: string, note?: string) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  userUpcomingSessions: (Session & { spot_name: string })[];
  fetchUserSessions: () => Promise<void>;
  isLoadingUserSessions: boolean;
}

const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { ensurePushToken } = useNotifications();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [userUpcomingSessions, setUserUpcomingSessions] = useState<(Session & { spot_name: string })[]>([]);
  const [isLoadingUserSessions, setIsLoadingUserSessions] = useState(false);

  const fetchSessionsForSpot = async (spotId: string) => {
    setIsLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_attendees(user_id)')
        .eq('spot_id', spotId)
        .eq('is_cancelled', false)
        .gte('starts_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('starts_at', { ascending: true });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      if (!data || data.length === 0) {
        setSessions([]);
        return;
      }

      // Collect unique creator IDs
      const creatorIds = [...new Set(data.map((row) => row.creator_id as string))];

      // Batch fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, avatar_id')
        .in('id', creatorIds);

      // Build profile map
      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null; avatar_id: number | null }> = {};
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = {
            display_name: p.display_name ?? null,
            avatar_url: p.avatar_url ?? null,
            avatar_id: p.avatar_id ?? null,
          };
        }
      }

      // Map to Session[]
      const mapped: Session[] = data.map((row) => ({
        id: row.id,
        spot_id: row.spot_id,
        creator_id: row.creator_id,
        starts_at: row.starts_at,
        note: row.note ?? null,
        is_cancelled: row.is_cancelled,
        created_at: row.created_at,
        creator_profile: profileMap[row.creator_id] ?? null,
        attendee_count: Array.isArray(row.session_attendees) ? row.session_attendees.length : 0,
        user_is_attending: Array.isArray(row.session_attendees)
          ? row.session_attendees.some((a: { user_id: string }) => a.user_id === user?.id)
          : false,
      }));

      setSessions(mapped);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const createSession = async (spotId: string, startsAt: string, note?: string) => {
    if (!user) return;

    // Request push permission + register token (silent fail — never blocks session creation)
    await ensurePushToken();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        spot_id: spotId,
        creator_id: user.id,
        starts_at: startsAt,
        note: note?.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    // Auto-insert creator as attendee
    const { error: attendeeError } = await supabase
      .from('session_attendees')
      .insert({ session_id: data.id, user_id: user.id });

    if (attendeeError) {
      console.error('Error inserting creator as attendee:', attendeeError);
    }

    // Refetch to get fresh data with profile join
    await fetchSessionsForSpot(spotId);
  };

  const joinSession = async (sessionId: string) => {
    if (!user) return;

    // Request push permission + register token (silent fail — never blocks join)
    await ensurePushToken();

    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, attendee_count: s.attendee_count + 1, user_is_attending: true }
          : s
      )
    );

    const { error } = await supabase
      .from('session_attendees')
      .upsert({ session_id: sessionId, user_id: user.id }, { onConflict: 'session_id,user_id' });

    if (error) {
      console.error('Error joining session:', error);
      // Rollback
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, attendee_count: s.attendee_count - 1, user_is_attending: false }
            : s
        )
      );
      throw error;
    }
  };

  const leaveSession = async (sessionId: string) => {
    if (!user) return;

    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, attendee_count: s.attendee_count - 1, user_is_attending: false }
          : s
      )
    );

    const { error } = await supabase
      .from('session_attendees')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving session:', error);
      // Rollback
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, attendee_count: s.attendee_count + 1, user_is_attending: true }
            : s
        )
      );
      throw error;
    }
  };

  const cancelSession = async (sessionId: string) => {
    if (!user) return;

    // Optimistic: find spot_id before removing from state
    const targetSession = sessions.find((s) => s.id === sessionId);

    // Optimistic update
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    const { error } = await supabase
      .from('sessions')
      .update({ is_cancelled: true })
      .eq('id', sessionId)
      .eq('creator_id', user.id);

    if (error) {
      console.error('Error cancelling session:', error);
      // Rollback: refetch for the spot
      if (targetSession) {
        await fetchSessionsForSpot(targetSession.spot_id);
      }
      throw error;
    }
  };

  const fetchUserSessions = async () => {
    if (!user) return;

    setIsLoadingUserSessions(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_attendees!inner(user_id), spots(name)')
        .eq('session_attendees.user_id', user.id)
        .eq('is_cancelled', false)
        .gte('starts_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('starts_at', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error fetching user sessions:', error);
        return;
      }

      if (!data || data.length === 0) {
        setUserUpcomingSessions([]);
        return;
      }

      // Collect creator IDs for profile batch fetch
      const creatorIds = [...new Set(data.map((row) => row.creator_id as string))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, avatar_id')
        .in('id', creatorIds);

      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null; avatar_id: number | null }> = {};
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = {
            display_name: p.display_name ?? null,
            avatar_url: p.avatar_url ?? null,
            avatar_id: p.avatar_id ?? null,
          };
        }
      }

      const mapped: (Session & { spot_name: string })[] = data.map((row) => ({
        id: row.id,
        spot_id: row.spot_id,
        creator_id: row.creator_id,
        starts_at: row.starts_at,
        note: row.note ?? null,
        is_cancelled: row.is_cancelled,
        created_at: row.created_at,
        creator_profile: profileMap[row.creator_id] ?? null,
        attendee_count: Array.isArray(row.session_attendees) ? row.session_attendees.length : 0,
        user_is_attending: true,
        spot_name: row.spots?.name ?? '',
      }));

      setUserUpcomingSessions(mapped);
    } finally {
      setIsLoadingUserSessions(false);
    }
  };

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        isLoadingSessions,
        fetchSessionsForSpot,
        createSession,
        joinSession,
        leaveSession,
        cancelSession,
        userUpcomingSessions,
        fetchUserSessions,
        isLoadingUserSessions,
      }}
    >
      {children}
    </SessionsContext.Provider>
  );
}

export function useSessions() {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionsProvider');
  }
  return context;
}
