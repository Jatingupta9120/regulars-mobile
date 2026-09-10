import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { TOUCH_MIN, space, type, useTheme } from './tokens';

export function Screen({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return <View style={[styles.screen, { backgroundColor: t.paper }]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return <Text style={[styles.title, { color: t.ink }]}>{children}</Text>;
}

export function Body({ children, dim }: { children: React.ReactNode; dim?: boolean }): JSX.Element {
  const t = useTheme();
  return <Text style={[styles.body, { color: dim ? t.dim : t.body }]}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return <Text style={[styles.label, { color: t.dim }]}>{children}</Text>;
}

/**
 * The primary action is always the largest element on screen and always sits in
 * the bottom third, within one-handed reach.
 */
export function Button({
  title,
  onPress,
  busy,
  tone = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  tone?: 'primary' | 'quiet' | 'danger';
  disabled?: boolean;
}): JSX.Element {
  const t = useTheme();
  const background = tone === 'primary' ? t.mark : tone === 'danger' ? t.danger : 'transparent';
  const color = tone === 'quiet' ? t.body : t.markInk;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: tone === 'quiet' ? t.rule : background,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.buttonText, { color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

/** A choice in a small set. Used for the check-in scale and yes/no answers. */
export function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): JSX.Element {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.choice,
        {
          backgroundColor: selected ? t.mark : t.surface,
          borderColor: selected ? t.mark : t.rule,
        },
      ]}
    >
      <Text style={[styles.choiceText, { color: selected ? t.markInk : t.body }]}>{label}</Text>
    </Pressable>
  );
}

export function Divider(): JSX.Element {
  const t = useTheme();
  return <View style={[styles.divider, { backgroundColor: t.rule }]} />;
}

export function ErrorNote({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.errorNote, { borderLeftColor: t.danger, backgroundColor: t.surface }]}
    >
      <Text style={{ color: t.danger, fontSize: type.small }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.md },
  title: { fontSize: type.h1, fontWeight: '700', letterSpacing: -0.5, marginBottom: space.sm },
  body: { fontSize: type.body, lineHeight: type.body * 1.5 },
  label: {
    fontSize: type.label,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '600',
  },
  button: {
    minHeight: TOUCH_MIN + 8,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonText: { fontSize: type.body, fontWeight: '600' },
  choice: {
    minHeight: TOUCH_MIN,
    minWidth: TOUCH_MIN,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  choiceText: { fontSize: type.body, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: space.lg },
  errorNote: { borderLeftWidth: 2, paddingVertical: space.sm, paddingHorizontal: space.md },
});
