import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'regulars.token';

function baseUrl(): string {
  const configured = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  return configured ?? 'http://localhost:4000/v1';
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Every error surfaced here is written for a person, not a developer. The
 * server sends a human message; if it does not, we supply one that says what to
 * do next rather than what went wrong internally.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError('No connection. Your session details still work offline.', 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message;
    throw new ApiError(message ?? 'That did not work. Try again in a moment.', response.status);
  }

  return payload as T;
}

export const api = {
  requestCode: (email: string) =>
    request<{ sent: true }>('/auth/code', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyCode: (email: string, code: string) =>
    request<{ accessToken: string }>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  me: () => request<Me>('/me'),

  updateMe: (patch: Partial<Pick<Me, 'displayName' | 'neighborhood' | 'reminderHour'>> & { pushToken?: string }) =>
    request<Me>('/me', { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteAccount: () => request<{ deleted: true }>('/me', { method: 'DELETE' }),

  myCohort: () => request<Cohort | null>('/cohorts/mine'),

  startVerification: () =>
    request<{ url: string; referenceId: string }>('/verification/start', { method: 'POST' }),

  checkout: (cohortId: string) =>
    request<{ url: string }>(`/cohorts/${cohortId}/checkout`, { method: 'POST' }),

  setAttendance: (sessionId: string, state: AttendanceState, note?: string) =>
    request<{ state: AttendanceState }>(`/sessions/${sessionId}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ state, note }),
    }),

  outstandingCheckIns: () =>
    request<Array<{ sessionId: string; weekNumber: number }>>('/check-ins/outstanding'),

  submitCheckIn: (sessionId: string, body: CheckInBody) =>
    request<{ ok: true }>(`/sessions/${sessionId}/check-in`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export type AttendanceState = 'EXPECTED' | 'ATTENDED' | 'LATE' | 'CANCELLED' | 'NO_SHOW';

export interface Me {
  id: string;
  email: string;
  displayName: string | null;
  neighborhood: string | null;
  ageBand: string | null;
  reminderHour: number;
  verification: { status: 'PENDING' | 'APPROVED' | 'FAILED'; failureCode: string | null } | null;
}

export interface SessionDetail {
  id: string;
  weekNumber: number;
  startsAt: string;
  durationMinutes: number;
  activity: string;
  venueName: string;
  venueAddress: string;
  nearestSubway: string | null;
  walkMinutes: number | null;
  doorNote: string | null;
  whatToBring: string | null;
  hostName: string | null;
}

export interface Cohort {
  id: string;
  status: 'FORMING' | 'CONFIRMED' | 'RUNNING' | 'GRADUATED' | 'CANCELLED';
  neighborhood: string;
  ageBand: string;
  womenOnly: boolean;
  priceCents: number;
  promised: { size: number; women: number };
  groupChatUrl: string | null;
  sessions: SessionDetail[];
  members: Array<{ firstName: string }>;
}

export interface CheckInBody {
  enjoyed: number;
  wouldReturn: boolean;
  feltSafe: boolean;
  romanticPressure?: boolean;
  note?: string;
  report?: { subjectId: string; severe: boolean; reason: string };
}
