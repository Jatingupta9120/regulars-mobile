import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, ApiError } from '../src/api/client';
import { useSession } from '../src/lib/session';
import { Body, Button, ErrorNote, Label, Title } from '../src/ui/components';
import { space, type, useTheme } from '../src/ui/tokens';

type Step = 'email' | 'code';

/**
 * No passwords. A six-digit code to an email address is the lowest-friction
 * sign-in that does not create a credential the member has to remember or that
 * we have to store.
 */
export default function SignIn(): JSX.Element {
  const t = useTheme();
  const { ready, signedIn, signIn } = useSession();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (ready && signedIn) return <Redirect href="/cohort" />;

  async function sendCode(): Promise<void> {
    setError('');
    setBusy(true);
    try {
      await api.requestCode(email.trim());
      setStep('code');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'That did not send. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(): Promise<void> {
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), code.trim());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  }

  const field = [styles.field, { borderColor: t.rule, color: t.ink, backgroundColor: t.surface }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.paper }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.top}>
          <Label>Regulars · New York</Label>
          <Title>
            {step === 'email' ? 'Six people, four Thursdays.' : 'Check your email.'}
          </Title>
          <Body dim>
            {step === 'email'
              ? 'Sign in with your email address. We send a six-digit code, and there is no password to remember.'
              : `We sent a six-digit code to ${email}. It expires in ten minutes.`}
          </Body>
        </View>

        <View style={styles.middle}>
          {step === 'email' ? (
            <TextInput
              style={field}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={t.dim}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              accessibilityLabel="Email address"
              returnKeyType="go"
              onSubmitEditing={() => void sendCode()}
            />
          ) : (
            <TextInput
              style={[...field, styles.code]}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={t.dim}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              accessibilityLabel="Six digit code"
              returnKeyType="go"
              onSubmitEditing={() => void submitCode()}
            />
          )}

          {error ? <ErrorNote>{error}</ErrorNote> : null}
        </View>

        {/* Primary action sits in the bottom third, within one-handed reach. */}
        <View style={styles.bottom}>
          <Button
            title={step === 'email' ? 'Send me a code' : 'Sign in'}
            busy={busy}
            disabled={step === 'email' ? email.length < 5 : code.length !== 6}
            onPress={() => void (step === 'email' ? sendCode() : submitCode())}
          />
          {step === 'code' ? (
            <View style={styles.secondary}>
              <Button
                title="Use a different email"
                tone="quiet"
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
              />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1, paddingHorizontal: space.md },
  top: { paddingTop: space.xxl, gap: space.sm },
  middle: { flex: 1, justifyContent: 'center', gap: space.md },
  bottom: { paddingBottom: space.xl, gap: space.sm },
  secondary: { marginTop: space.xs },
  field: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: type.lede,
  },
  code: { textAlign: 'center', letterSpacing: 8, fontSize: 28 },
});
