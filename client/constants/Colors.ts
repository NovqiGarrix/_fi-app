/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FCFCFC',
    background: '#1A1A1A',
    tint: '#723FEB',
    icon: '#FCFCFC',
    tabIconDefault: '#B1B1B1',
    tabIconSelected: '#FCFCFC',
    tintSecondary: '#97E0F7',
  },
};
