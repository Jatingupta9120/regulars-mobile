import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../src/api/client';
import { useSession } from '../src/lib/session';
import { Body, Button, Divider, ErrorNote, Label, Title } from '../src/ui/components';
import { space, useTheme } from '../src/ui/tokens';

function money(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

/**
 * The offer, shown before any money moves.
 *
 * The composition is stated here in the same size type as the price, because it
 * is the part being promised. The API refuses to confirm a cohort that does not
 * meet what this screen said, so nothing here can quietly become untrue.
 */
export default function OfferScreen(): JSX.Element {
  const t = useTheme();
  const router = useRouter();
  const { cohort, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!cohort) {
    return (
      <View style={[styles.empty, { backgroundColor: t.paper }]}>
        <Title>No offer waiting.</Title>
        <Body dim>We will tell you within two weeks either way.</Body>
      </View>
    );
  }

  // Narrowed above; bind it so the async callback does not re-widen it.
  const offer = cohort;
  const perSession = Math.round(offer.priceCents / 100 / offer.sessions.length);

  async function pay(): Promise<void> {
    setError('');
    setBusy(true);
    try {
      const { url } = await api.checkout(offer.id);
      await Linking.openURL(url);
      await refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Checkout did not open. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: t.paper }} contentContainerStyle={styles.content}>
      <Label>A cohort is forming near you</Label>
      <Title>
        {cohort.neighborhood}, {cohort.ageBand}
      </Title>

      <Divider />

      <Label>Who will be there</Label>
      <View style={styles.figures}>
        <View>
          <Body dim>Group size</Body>
          <Body>{cohort.promised.size} people, including you</Body>
        </View>
        <View>
          <Body dim>Women in the group</Body>
          <Body>
            {cohort.womenOnly
              ? 'All six. This is a women-only cohort.'
              : `${cohort.promised.women} of ${cohort.promised.size}`}
          </Body>
        </View>
      </View>
      <Body dim>
        If we cannot fill it exactly as written above, we do not run it and you are refunded in
        full. We never substitute someone in to make the numbers work.
      </Body>

      <Divider />

      <Label>The four evenings</Label>
      {cohort.sessions.map((s) => (
        <View key={s.id} style={styles.session}>
          <Body>
            Week {s.weekNumber} · {s.activity}
          </Body>
          <Body dim>
            {new Date(s.startsAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
            {' · '}
            {s.venueName}
          </Body>
        </View>
      ))}

      <Divider />

      <Label>What it costs</Label>
      <View style={styles.price}>
        <Title>{money(cohort.priceCents)}</Title>
        <Body dim>
          once, for all {cohort.sessions.length} evenings. That is ${perSession} a night.
        </Body>
      </View>
      <Body>
        One charge. There is no subscription, nothing recurring, and nothing to cancel later. We do
        not keep your card.
      </Body>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <View style={styles.action}>
        <Button title={`Pay ${money(cohort.priceCents)} and join`} busy={busy} onPress={() => void pay()} />
      </View>
      <View style={styles.action}>
        <Button title="Not this one" tone="quiet" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.xs,
  },
  empty: { flex: 1, justifyContent: 'center', padding: space.md, gap: space.sm },
  figures: { gap: space.md, marginVertical: space.sm },
  session: { marginBottom: space.sm },
  price: { marginVertical: space.sm, gap: space.xs },
  action: { marginTop: space.sm },
});
