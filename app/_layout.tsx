import { DarkTheme, DefaultTheme, ThemeProvider as ThemeProviderNative } from '@react-navigation/native';
import { Stack, useRouter, usePathname } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import 'react-native-reanimated';
import * as NativeSplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '../context/ThemeContext';
import SplashScreen from '../components/SplashScreen';
import { useNotifications } from '../hooks/useNotifications';

// User data interface
export interface UserData {
  id?: string;
  name?: string;
  email: string;
  role: 'student' | 'warden';
  assignedHostel?: string;
  roomNumber?: string;
  phoneNumber?: string;
  createdAt?: string;
}

// Add an explicit interface/type for auth context
interface AuthContextProps {
  isLoggedIn: boolean;
  user: UserData | null;
  login: (userData: UserData) => void;
  logout: () => void;
}

// Provide a safe default to avoid null errors
const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  user: null,
  login: () => { throw new Error('AuthContext not initialized'); },
  logout: () => { throw new Error('AuthContext not initialized'); },
});

export function useAuth() {
  return useContext(AuthContext);
}

// Change anchor to login so app starts at login screen
export const unstable_settings = {
  anchor: 'login',
};

// Keep the splash screen visible while we fetch resources
NativeSplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this error, safe to ignore */
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize notifications
  const pushNotificationState = useNotifications(user?.id);

  // You can log the notification state or handle specific notifications here
  useEffect(() => {
    if (pushNotificationState.notification) {
      console.log('New notification received:', pushNotificationState.notification);
    }
  }, [pushNotificationState.notification]);

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
    // Hide native splash after a short delay to allow our JS splash to over-render
    const timer = setTimeout(() => {
      NativeSplashScreen.hideAsync().catch(() => { });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Navigation guard - only run after mount and when pathname is available
  useEffect(() => {
    if (!isMounted || !pathname) return;

    // Use setTimeout to ensure router is fully ready
    const timer = setTimeout(() => {
      try {
        // If user is not logged in and trying to access protected routes
        if (!isLoggedIn && !['/login', '/signup', '/verify-otp'].includes(pathname)) {
          // Only show alert if not already on login/signup
          if (pathname !== '/login' && pathname !== '/signup') {
            Alert.alert(
              'Authentication Required',
              'Please login to access this page.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    try {
                      router.replace('/login');
                    } catch (err) {
                      console.log('Navigation error:', err);
                    }
                  }
                }
              ]
            );
          }
          // Navigate without alert if already redirecting
          if (!pathname.startsWith('/login') && !pathname.startsWith('/signup') && !pathname.startsWith('/verify-otp')) {
            router.replace('/login');
          }
        }
        // If user is logged in and trying to access login/signup pages
        else if (isLoggedIn && ['/login', '/signup', '/'].includes(pathname)) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        // Silently catch navigation errors during mount
        console.log('Navigation not ready yet:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoggedIn, pathname, isMounted, router]);

  // Login function - stores user data
  const login = (userData: UserData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // Logout function - clears user data
  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    try {
      router.replace('/login');
    } catch (error) {
      console.log('Logout navigation error:', error);
    }
  };

  // Provide login/logout functions with user data
  const auth = useMemo(() => ({
    isLoggedIn,
    user,
    login,
    logout
  }), [isLoggedIn, user]);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={auth}>
        <ThemeProviderNative value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="analysis" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="support-center" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProviderNative>
      </AuthContext.Provider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </ThemeProvider>
  );
}
