import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken, type Cohort, type Me } from '../api/client';
import { cacheCohort, cachedCohort } from './offline';

interface SessionValue {
  ready: boolean;
  signedIn: boolean;
  me: Me | null;
  cohort: Cohort | null;
  /** True when we are showing cached data because the network is unreachable. */
  stale: boolean;
  signIn: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [stale, setStale] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    // Settled, not all: the cohort request is refused until verification
    // passes, and losing the profile because of that would hide the very
    // banner telling you to verify.
    const [profile, current] = await Promise.allSettled([api.me(), api.myCohort()]);

    if (profile.status === 'fulfilled') setMe(profile.value);

    if (current.status === 'fulfilled') {
      setCohort(current.value);
      setStale(false);
      await cacheCohort(current.value);
      return;
    }

    // Offline, or the token expired. Fall back to whatever we last saw so the
    // member can still find the address for tonight.
    const fallback = await cachedCohort();
    if (fallback) {
      setCohort(fallback);
      setStale(true);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const token = await getToken();
      if (token) {
        setSignedIn(true);
        await refresh();
      }
      setReady(true);
    })();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, code: string): Promise<void> => {
      const { accessToken } = await api.verifyCode(email, code);
      await setToken(accessToken);
      setSignedIn(true);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await clearToken();
    await cacheCohort(null);
    setSignedIn(false);
    setMe(null);
    setCohort(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ ready, signedIn, me, cohort, stale, signIn, signOut, refresh }),
    [ready, signedIn, me, cohort, stale, signIn, signOut, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
