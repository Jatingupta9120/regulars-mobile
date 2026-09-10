import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../src/api/client';
import { useSession } from '../src/lib/session';
import { Body, Button, Divider, ErrorNote, Label, Title } from '../src/ui/components';
import { space, useTheme } from '../src/ui/tokens';

export default function ProfileScreen(): JSX.Element {
  const t = useTheme();
  const router = useRouter();
  const { me, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function confirmDelete(): void {
    Alert.alert(
      'Delete your account?',
      'Your profile and email address are removed within seven days. One thing is kept: if you were ever removed from a cohort for a safety reason, that record stays, because deleting it would let the removal be undone with a new address.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            void api
              .deleteAccount()
              .then(() => signOut())
              .then(() => router.replace('/'))
              .catch((cause: unknown) => {
                setError(
                  cause instanceof ApiError ? cause.message : 'That did not go through. Try again.',
                );
              })
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={{ backgroundColor: t.paper }} contentContainerStyle={styles.content}>
      <Title>You</Title>
      <Body dim>{me?.email ?? ''}</Body>

      <Divider />

      <Label>Notifications</Label>
      <Body>
        We send at most eight across a whole cohort: the day-of reminder for each session, one when
        your cohort is confirmed, and one if someone in your group cancels. Nothing else, ever.
      </Body>
      <Body dim>
        Your reminder arrives at {me?.reminderHour ?? 9}:00 on the day. Change it in your phone
        settings or write to us.
      </Body>

      <Divider />

      <Label>Safety</Label>
      <Body>
        Something happened and you would rather not wait for the check-in? Write to us and a person
        answers the same day.
      </Body>
      <View style={styles.action}>
        <Button
          title="Email safety@regulars.nyc"
          tone="quiet"
          onPress={() => void Linking.openURL('mailto:safety@regulars.nyc')}
        />
      </View>
      <View style={styles.action}>
        <Button
          title="Read the New York safety notice"
          tone="quiet"
          onPress={() => void Linking.openURL('https://regulars.nyc/safety-notice')}
        />
      </View>

      <Divider />

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <View style={styles.action}>
        <Button title="Sign out" tone="quiet" onPress={() => void signOut().then(() => router.replace('/'))} />
      </View>

      {/* Both app stores require in-app account deletion. */}
      <View style={styles.action}>
        <Button title="Delete my account" tone="danger" busy={busy} onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.md, paddingBottom: space.xxl, gap: space.xs },
  action: { marginTop: space.sm },
});
