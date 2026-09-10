import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ApiError, type AttendanceState } from '../../src/api/client';
import { useSession } from '../../src/lib/session';
import { Body, Button, Divider, ErrorNote, Label, Title } from '../../src/ui/components';
import { space, useTheme } from '../../src/ui/tokens';

/**
 * One screen per session. "Getting there" is given as much weight as the
 * activity itself, because arriving-alone anxiety is the single biggest cause
 * of a no-show and a walking time from the subway fixes more of it than any
 * amount of encouragement.
 */
export default function SessionScreen(): JSX.Element {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cohort } = useSession();
  const [busy, setBusy] = useState<AttendanceState | null>(null);
  const [error, setError] = useState('');
  const [declared, setDeclared] = useState<AttendanceState | null>(null);

  const found = cohort?.sessions.find((s) => s.id === id);

  if (!found) {
    return (
      <View style={[styles.missing, { backgroundColor: t.paper }]}>
        <Title>That session is not in your cohort.</Title>
        <Body dim>If you think it should be, pull to refresh on the previous screen.</Body>
      </View>
    );
  }

  // Narrowed above; bind it so the callbacks below do not re-widen it.
  const session = found;
  const starts = new Date(session.startsAt);

  async function declare(state: AttendanceState): Promise<void> {
    setError('');
    setBusy(state);
    try {
      await api.setAttendance(session.id, state);
      setDeclared(state);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'That did not send. Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: t.paper }} contentContainerStyle={styles.content}>
      <Label>Week {session.weekNumber}</Label>
      <Title>{session.activity}</Title>
      <Body>
        {starts.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        {' · '}
        {starts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        {' · '}
        {session.durationMinutes >= 60
          ? `${Math.round(session.durationMinutes / 60)} hours`
          : `${session.durationMinutes} minutes`}
      </Body>

      <Divider />

      <Label>Getting there</Label>
      <Body>{session.venueName}</Body>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open ${session.venueAddress} in maps`}
        onPress={() =>
          void Linking.openURL(
            `https://maps.apple.com/?q=${encodeURIComponent(session.venueAddress)}`,
          )
        }
        style={styles.link}
      >
        <Body>{session.venueAddress}</Body>
      </Pressable>

      {session.nearestSubway ? (
        <Body dim>
          {session.nearestSubway}
          {session.walkMinutes ? `, ${session.walkMinutes} minutes on foot` : ''}
        </Body>
      ) : null}
      {session.doorNote ? <Body dim>{session.doorNote}</Body> : null}

      {session.whatToBring ? (
        <>
          <Divider />
          <Label>What to bring</Label>
          <Body>{session.whatToBring}</Body>
        </>
      ) : null}

      {session.hostName ? (
        <>
          <Divider />
          <Label>Your host</Label>
          <Body>
            {session.hostName} runs this one, makes the introductions, and stays until the group can
            carry itself.
          </Body>
        </>
      ) : null}

      <Divider />

      {declared ? (
        <Body dim>
          {declared === 'CANCELLED'
            ? 'We told the group you cannot make it. Nothing else to do.'
            : 'We told the group you are running late.'}
        </Body>
      ) : (
        <>
          <Label>If something changes</Label>
          <Body dim>
            Telling us takes one tap and we tell the group for you. You do not have to write
            anything.
          </Body>
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <View style={styles.actions}>
            <Button
              title="I am running late"
              tone="quiet"
              busy={busy === 'LATE'}
              onPress={() => void declare('LATE')}
            />
            <Button
              title="I cannot make it"
              tone="quiet"
              busy={busy === 'CANCELLED'}
              onPress={() => void declare('CANCELLED')}
            />
          </View>
        </>
      )}

      <Divider />
      <Button
        title="Report something that happened"
        tone="danger"
        onPress={() => router.push(`/check-in/${session.id}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.md, paddingBottom: space.xxl, gap: space.xs },
  missing: { flex: 1, padding: space.md, gap: space.sm, justifyContent: 'center' },
  link: { minHeight: 44, justifyContent: 'center' },
  actions: { gap: space.sm, marginTop: space.sm },
});
