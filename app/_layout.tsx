import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../src/lib/session';
import { useTheme } from '../src/ui/tokens';

export default function RootLayout(): JSX.Element {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: t.paper },
            headerTintColor: t.ink,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: t.paper },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="cohort" options={{ title: 'Your cohort' }} />
          <Stack.Screen name="verify" options={{ title: 'Verification' }} />
          <Stack.Screen name="offer" options={{ title: 'Your offer' }} />
          <Stack.Screen name="session/[id]" options={{ title: '' }} />
          <Stack.Screen name="check-in/[sessionId]" options={{ title: 'Check in', presentation: 'modal' }} />
          <Stack.Screen name="profile" options={{ title: 'You' }} />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
