import { useColorScheme } from 'react-native';

/**
 * Direction C, "Quiet". Deliberately low-stimulation: no badges, no counts, no
 * red dots, no accent that shouts. The one saturated colour in the system is
 * the deep ink blue, and it is spent on the primary action and nothing else.
 *
 * Danger red exists only in the report flow. If you find yourself reaching for
 * it anywhere else, the screen is wrong.
 */
export interface Theme {
  readonly paper: string;
  readonly surface: string;
  readonly ink: string;
  readonly body: string;
  readonly dim: string;
  readonly rule: string;
  readonly mark: string;
  readonly markInk: string;
  readonly danger: string;
}

const light: Theme = {
  paper: '#FBFAF7',
  surface: '#FFFFFF',
  ink: '#101418',
  body: '#2B3138',
  dim: '#5A6169',
  rule: '#DCD9D1',
  mark: '#123A5E',
  markInk: '#FBFAF7',
  danger: '#8A3324',
};

const dark: Theme = {
  paper: '#12151A',
  surface: '#191D24',
  ink: '#ECEAE4',
  body: '#CDD2D8',
  dim: '#98A0A8',
  rule: '#2A2F36',
  mark: '#7FA9D4',
  markInk: '#0D1116',
  danger: '#D98B78',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

/** 1.25 type scale anchored at 17. Sizes are unscaled; Dynamic Type multiplies. */
export const type = {
  micro: 12,
  label: 13,
  small: 15,
  body: 17,
  lede: 20,
  h2: 24,
  h1: 30,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
} as const;

/** iOS and Android both want 44 minimum. Nothing tappable is smaller. */
export const TOUCH_MIN = 44;
