import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Cohort } from '../api/client';

const COHORT_KEY = 'regulars.cohort.v1';

/**
 * Session details must be readable with no network. The primary reading context
 * for this app is a subway platform, where there is no signal and the member is
 * already anxious about arriving alone.
 */
export async function cacheCohort(cohort: Cohort | null): Promise<void> {
  try {
    if (cohort) await AsyncStorage.setItem(COHORT_KEY, JSON.stringify(cohort));
    else await AsyncStorage.removeItem(COHORT_KEY);
  } catch {
    // A failed cache write is not worth surfacing. The network copy still works.
  }
}

export async function cachedCohort(): Promise<Cohort | null> {
  try {
    const raw = await AsyncStorage.getItem(COHORT_KEY);
    return raw ? (JSON.parse(raw) as Cohort) : null;
  } catch {
    return null;
  }
}
