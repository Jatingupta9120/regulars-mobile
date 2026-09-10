import * as Notifications from 'expo-notifications';
import { api } from '../api/client';

/**
 * Permission is requested at the moment the first reminder becomes useful —
 * when a cohort is confirmed — and never on launch. Asking before the member
 * knows what they would be agreeing to is how apps get denied permanently.
 *
 * Returns false when the member says no. That is a valid, permanent answer and
 * nothing in the app should nag afterwards.
 */
export async function registerForReminders(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.granted ||
    existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  const decision = granted ? existing : await Notifications.requestPermissionsAsync();
  if (!decision.granted) return false;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await api.updateMe({ pushToken: token.data });
    return true;
  } catch {
    return false;
  }
}

export async function reminderPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}
