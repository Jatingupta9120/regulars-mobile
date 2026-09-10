import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../src/api/client';
import { useSession } from '../src/lib/session';
import { Body, Button, Divider, ErrorNote, Label, Title } from '../src/ui/components';
import { space, useTheme } from '../src/ui/tokens';

/**
 * The screen that decides whether this product exists.
 *
 * A 31-year-old woman who has already had a bad experience with an app in this
 * category is being asked to photograph her driving licence. She gets to read
 * exactly what happens to it *before* a camera ever opens. Every sentence here
 * is a promise the API actually keeps.
 */
export default function VerifyScreen(): JSX.Element {
  const t = useTheme();
  const router = useRouter();
  const { me, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = me?.verification?.status;

  async function start(): Promise<void> {
    setError('');
    setBusy(true);
    try {
      const { url } = await api.startVerification();
      await Linking.openURL(url);
      await refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'That did not open. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'PENDING') {
    return (
      <ScrollView style={{ backgroundColor: t.paper }} contentContainerStyle={styles.content}>
        <Label>In review</Label>
        <Title>We are checking now.</Title>
        <Body>
          This usually finishes within two hours, and always within one day. You will get one
          notification when it is done. There is nothing to do in the meantime and nothing to
          watch.
        </Body>
        <View style={styles.action}>
          <Button title="Back" tone="quiet" onPress={() => router.back()} />
        </View>
      </ScrollView>
    );
  }

  if (status === 'FAILED') {
    const code = me?.verification?.failureCode;
    return (
      <ScrollView style={{ backgroundColor: t.paper }} contentContainerStyle={styles.content}>
        <Label>Not readable</Label>
        <Title>
          {code === 'not_eligible' ? 'We cannot verify this account.' : 'Let us try that again.'}
        </Title>
        {code === 'not_eligible' ? (
          <Body>
            This account is not eligible to join a cohort. If you think that is wrong, write to
            safety@regulars.nyc and a person will read it.
          </Body>
        ) : (
          <>
            <Body>
              Nothing is wrong with your ID. The photo could not be read, which is almost always
              one of three things.
            </Body>
            <Body dim>Glare from a light or a window across the front of the card.</Body>
            <Body dim>An edge or a corner cropped out of frame.</Body>
            <Body dim>The card is expired.</Body>
          </>
        )}
        {error ? <ErrorNote>{error}</ErrorNote> : null}
        {code !== 'not_eligible' ? (
          <View style={styles.action}>
            <Button title="Try again" busy={busy} onPress={() => void start()} />
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: t.paper }} contentContainerStyle={styles.content}>
      <Label>One time, before anything else</Label>
      <Title>Everyone here is ID-verified.</Title>
      <Body>
        You photograph a government ID and take a short selfie. So does every other person in your
        cohort, before anyone sees anyone.
      </Body>

      <Divider />

      <Label>What happens to it</Label>
      <Body>
        The photo goes straight to our verification provider. It does not pass through our servers
        and we never receive it.
      </Body>
      <Body>
        What we keep is a yes or no, the type of document, and a code that identifies you. We keep
        the code for one reason: if someone is ever removed for how they behaved, that code stops
        them signing up again on Tuesday with a new email address.
      </Body>
      <Body dim>
        Nobody in your cohort sees your legal name, your date of birth, or that you were verified
        at all. They see a first name.
      </Body>

      <Divider />

      <Label>How long</Label>
      <Body>About two minutes now, and usually under two hours to hear back.</Body>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <View style={styles.action}>
        <Button title="Verify my ID" busy={busy} onPress={() => void start()} />
      </View>
      <View style={styles.action}>
        <Button title="Not right now" tone="quiet" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.sm,
  },
  action: { marginTop: space.sm },
});
