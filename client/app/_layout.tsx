import { categoryCollection, database } from '@/lib/db';
import { DEFAULT_CATEGORIES } from '@/utils/constants';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotifierWrapper } from 'react-native-notifier';
import 'react-native-reanimated';
import "../global.css";

const IGNORED_LOGS = [
  'setLayoutAnimationEnabledExperimental',
  'VirtualizedLists should never be nested',
];

LogBox.ignoreLogs(IGNORED_LOGS);

// LogBox only hides the in-app overlay; filter the Metro terminal output too.
const shouldIgnore = (args: unknown[]) => {
  const first = args[0];
  return typeof first === 'string' && IGNORED_LOGS.some((msg) => first.includes(msg));
};

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (shouldIgnore(args)) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (shouldIgnore(args)) return;
  originalError(...args);
};

// import { useColorScheme } from '@/hooks/useColorScheme';

if (process.env.EXPO_PUBLIC_RESET_ONBOARDING) {
  AsyncStorage.removeItem('onboardingComplete');
}

if (process.env.EXPO_PUBLIC_RESET_DB) {
  database.write(async () => {
    await database.unsafeResetDatabase();

    // Insert default categories or other initial data if needed
    await database.batch(
      DEFAULT_CATEGORIES.map((c) => {
        return categoryCollection.prepareCreate((category) => {
          category.name = c.name;
          category.color = c.color;
        })
      })
    );
  })
    .then(() => {
      console.log('Database reset successfully');
    }).catch(console.error);
}

function useColorScheme() {
  return 'dark';
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(() => new QueryClient());

  const [loaded] = useFonts({
    ManropeBold: require('../assets/fonts/Manrope-Bold.ttf'),
    ManropeExtraBold: require('../assets/fonts/Manrope-ExtraBold.ttf'),
    ManropeExtraLight: require('../assets/fonts/Manrope-ExtraLight.ttf'),
    ManropeLight: require('../assets/fonts/Manrope-Light.ttf'),
    ManropeMedium: require('../assets/fonts/Manrope-Medium.ttf'),
    ManropeRegular: require('../assets/fonts/Manrope-Regular.ttf'),
    ManropeSemiBold: require('../assets/fonts/Manrope-SemiBold.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider database={database}>
          <GestureHandlerRootView>
            <NotifierWrapper>
              <Slot />
            </NotifierWrapper>
          </GestureHandlerRootView>
        </DatabaseProvider>
      </QueryClientProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
