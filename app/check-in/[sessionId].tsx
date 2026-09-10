import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ApiError, type CheckInBody } from '../../src/api/client';
import { useSession } from '../../src/lib/session';
import { Body, Button, Choice, Divider, ErrorNote, Label, Title } from '../../src/ui/components';
import { space, type, useTheme } from '../../src/ui/tokens';

/**
 * The most important screen in the app.
 *
 * Rules it must never break:
 *   - Under thirty seconds, completable one-handed on a moving subway.
 *   - The privacy promise is stated on screen, not buried in a policy.
 *   - Nothing here is required. A member who wants to say nothing can leave.
 *   - The reporter is never told what happened next. No confirmation that
 *     someone was removed, no count of other reports.
 */
export default function CheckInScreen(): JSX.Element {
  const t = useTheme();
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { cohort, refresh } = useSession();

  const [enjoyed, setEnjoyed] = useState<number | null>(null);
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [feltSafe, setFeltSafe] = useState<boolean | null>(null);
  const [romantic, setRomantic] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const needsReport = feltSafe === false || romantic;
  const complete = enjoyed !== null && wouldReturn !== null && feltSafe !== null;

  async function submit(): Promise<void> {
    if (!complete) return;
    setError('');
    setBusy(true);

    const body: CheckInBody = {
      enjoyed,
      wouldReturn,
      feltSafe,
      romanticPressure: romantic,
      note: note.trim() || undefined,
    };

    try {
      await api.submitCheckIn(sessionId, body);
      await refresh();
      router.back();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'That did not send. Try once more.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: t.paper }} contentContainerStyle={styles.content}>
      <Title>How was it?</Title>

      {/* The promise, stated where it is read, not in a policy screen. */}
      <View style={[styles.promise, { borderLeftColor: t.mark }]}>
        <Body dim>
          Nobody in your group sees this. They are not told that you filled it in, and you will
          never see anyone else&rsquo;s answers or your own ratings.
        </Body>
      </View>

      <Divider />

      <Label>Did you enjoy it?</Label>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Choice
            key={n}
            label={String(n)}
            selected={enjoyed === n}
            onPress={() => setEnjoyed(n)}
          />
        ))}
      </View>
      <Body dim>1 is I left early, 5 is I stayed later than I meant to.</Body>

      <Divider />

      <Label>Would you go again?</Label>
      <View style={styles.row}>
        <Choice label="Yes" selected={wouldReturn === true} onPress={() => setWouldReturn(true)} />
        <Choice label="No" selected={wouldReturn === false} onPress={() => setWouldReturn(false)} />
      </View>

      <Divider />

      <Label>Did anyone make you uncomfortable?</Label>
      <View style={styles.row}>
        <Choice label="No" selected={feltSafe === true} onPress={() => setFeltSafe(true)} />
        <Choice label="Yes" selected={feltSafe === false} onPress={() => setFeltSafe(false)} />
      </View>

      <Divider />

      <Label>Was anyone treating this as a date?</Label>
      <View style={styles.row}>
        <Choice label="No" selected={!romantic} onPress={() => setRomantic(false)} />
        <Choice label="Yes" selected={romantic} onPress={() => setRomantic(true)} />
      </View>

      {needsReport ? (
        <>
          <Divider />
          <Label>Tell us what happened</Label>
          <Body dim>
            Optional. Even a sentence helps, and a person reads it the same day. If you would
            rather say nothing, that is fine and your answers above already count.
          </Body>
          <TextInput
            style={[styles.notes, { borderColor: t.rule, color: t.ink, backgroundColor: t.surface }]}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            accessibilityLabel="What happened"
            placeholder=""
            textAlignVertical="top"
          />
        </>
      ) : (
        <>
          <Divider />
          <Label>Anything else</Label>
          <TextInput
            style={[styles.notes, { borderColor: t.rule, color: t.ink, backgroundColor: t.surface }]}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            accessibilityLabel="Anything else, optional"
            textAlignVertical="top"
          />
        </>
      )}

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <View style={styles.submit}>
        <Button title="Send" busy={busy} disabled={!complete} onPress={() => void submit()} />
        {!complete ? <Body dim>Three taps and you are done.</Body> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.md, paddingTop: space.lg, paddingBottom: space.xxl, gap: space.xs },
  promise: { borderLeftWidth: 2, paddingLeft: space.md, marginTop: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  notes: {
    borderWidth: 1,
    borderRadius: 4,
    padding: space.md,
    fontSize: type.body,
    minHeight: 110,
    marginTop: space.xs,
  },
  submit: { marginTop: space.lg, gap: space.sm },
});
