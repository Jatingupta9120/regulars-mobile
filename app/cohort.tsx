import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Link, Redirect, useRouter } from 'expo-router';
import { api, type SessionDetail } from '../src/api/client';
import { useSession } from '../src/lib/session';
import { registerForReminders } from '../src/lib/push';
import { Body, Button, Divider, Label, Title } from '../src/ui/components';
import { space, type, useTheme } from '../src/ui/tokens';

function weekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/**
 * The home screen, and one of only two destinations in the app. Shows the four
 * sessions in order with the next one first. No feed, no counts, no badges.
 */
export default function CohortScreen(): JSX.Element {
  const t = useTheme();
  const router = useRouter();
  const { ready, signedIn, cohort, stale, refresh, me } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [owing, setOwing] = useState<Array<{ sessionId: string; weekNumber: number }>>([]);

  useEffect(() => {
    void api
      .outstandingCheckIns()
      .then(setOwing)
      .catch(() => setOwing([]));
  }, [cohort?.id]);

  // Permission is asked for exactly once, at the moment a reminder first
  // becomes useful. Never on launch, and never again if the answer was no.
  useEffect(() => {
    if (cohort?.status === 'CONFIRMED' || cohort?.status === 'RUNNING') {
      void registerForReminders();
    }
  }, [cohort?.status]);

  if (ready && !signedIn) return <Redirect href="/" />;

  const verification = me?.verification?.status;

  return (
    <ScrollView
      style={{ backgroundColor: t.paper }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void refresh().finally(() => setRefreshing(false));
          }}
        />
      }
    >
      {stale ? (
        <View style={[styles.notice, { borderColor: t.rule, backgroundColor: t.surface }]}>
          <Body dim>
            No connection. These are the details we last saved, which is enough to get you there.
          </Body>
        </View>
      ) : null}

      {verification !== 'APPROVED' ? (
        <Link href="/verify" asChild>
          <Pressable
            accessibilityRole="button"
            style={[styles.notice, { borderColor: t.mark, backgroundColor: t.surface }]}
          >
            <Label>
              {verification === 'PENDING'
                ? 'Verification in review'
                : verification === 'FAILED'
                  ? 'Verification needs another try'
                  : 'One step first'}
            </Label>
            <Body>
              {verification === 'PENDING'
                ? 'We usually finish within two hours. One notification when it is done.'
                : verification === 'FAILED'
                  ? 'The photo could not be read. It takes about two minutes to redo.'
                  : 'Everyone here is ID-verified before anyone sees anyone. Two minutes.'}
            </Body>
          </Pressable>
        </Link>
      ) : null}

      {!cohort ? (
        <View style={styles.empty}>
          <Title>No cohort yet.</Title>
          <Body dim>
            We are still matching six people in your neighborhood and age band. You will hear from
            us within two weeks either way, and we will say how many people we are short.
          </Body>
        </View>
      ) : (
        <>
          <Label>
            {cohort.neighborhood} · {cohort.ageBand}
            {cohort.womenOnly ? ' · women only' : ''}
          </Label>
          <Title>Four Thursdays</Title>
          <Body dim>
            {cohort.members.length > 0
              ? `You and ${cohort.members.map((m) => m.firstName).join(', ')}.`
              : `A group of ${cohort.promised.size}, ${cohort.promised.women} of them women. Names once everyone has paid.`}
          </Body>

          {cohort.status === 'FORMING' ? (
            <View style={styles.action}>
              <Button title="Review your offer" onPress={() => router.push('/offer')} />
            </View>
          ) : null}

          <Divider />

          {cohort.sessions.map((session) => (
            <SessionRow key={session.id} session={session} owed={owing.some((o) => o.sessionId === session.id)} />
          ))}

          {cohort.status === 'GRADUATED' && cohort.groupChatUrl ? (
            <View style={styles.graduated}>
              <Label>You graduated</Label>
              <Body>
                That is the last of the four. The group is yours now and we have stopped charging
                you.
              </Body>
              <View style={styles.action}>
                <Button title="Open your group chat" onPress={() => router.push(cohort.groupChatUrl ?? '/')} />
              </View>
            </View>
          ) : null}
        </>
      )}

      <Divider />
      <Link href="/profile" asChild>
        <Pressable accessibilityRole="button" style={styles.profileLink}>
          <Body dim>You, and your settings</Body>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

function SessionRow({ session, owed }: { session: SessionDetail; owed: boolean }): JSX.Element {
  const t = useTheme();
  const past = isPast(session.startsAt);

  return (
    <Link href={owed ? `/check-in/${session.id}` : `/session/${session.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Week ${session.weekNumber}, ${session.activity}, ${weekday(session.startsAt)}`}
        style={({ pressed }) => [
          styles.row,
          { borderColor: t.rule, backgroundColor: t.surface, opacity: pressed ? 0.85 : past && !owed ? 0.55 : 1 },
        ]}
      >
        <View style={styles.rowTop}>
          <Label>Week {session.weekNumber}</Label>
          {owed ? <Label>Check in</Label> : null}
        </View>
        <Body>{session.activity}</Body>
        <Body dim>
          {weekday(session.startsAt)} · {clock(session.startsAt)}
        </Body>
        <Body dim>{session.venueName}</Body>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.md, paddingTop: space.lg, paddingBottom: space.xxl, gap: space.sm },
  notice: { borderWidth: 1, borderRadius: 4, padding: space.md, gap: space.xs, marginBottom: space.md },
  empty: { gap: space.sm, paddingTop: space.xl },
  row: { borderWidth: 1, borderRadius: 4, padding: space.md, gap: 2, marginBottom: space.sm },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xs },
  graduated: { gap: space.sm, paddingTop: space.md },
  action: { marginTop: space.sm },
  profileLink: { minHeight: 44, justifyContent: 'center' },
  spacer: { height: type.body },
});
