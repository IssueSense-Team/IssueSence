import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './_layout';
import Constants from 'expo-constants';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import AnimatedInput from '../components/AnimatedInput';
import { useGoogleAuth } from '../utils/googleAuth';
import AnimatedBackground from '../components/AnimatedBackground';
import FlipWords from '../components/FlipWords';

const { width } = Dimensions.get('window');

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [role, setRole] = useState<'student' | 'warden'>('student');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Animations
  const shakeTranslateX = useSharedValue(0);
  const passwordStrength = useSharedValue(0);

  React.useEffect(() => {
    let score = 0;
    if (password.length > 5) score += 0.3;
    if (/[A-Z]/.test(password)) score += 0.3;
    if (/[0-9]/.test(password)) score += 0.4;
    passwordStrength.value = withSpring(score);
  }, [password]);

  const triggerErrorShake = () => {
    shakeTranslateX.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }]
  }));

  const animatedStrengthStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      passwordStrength.value,
      [0, 0.5, 1],
      ['#ef4444', '#f59e0b', '#22c55e']
    );
    return {
      width: `${passwordStrength.value * 100}%`,
      backgroundColor
    };
  });

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      triggerErrorShake();
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (role === 'student' && !roomNumber) {
      triggerErrorShake();
      Alert.alert("Error", "Please provide your room number");
      return;
    }

    if (!hostelName) {
      triggerErrorShake();
      Alert.alert("Error", `Please provide your ${role === 'student' ? 'Hostel Name' : 'Assigned Hostel'}`);
      return;
    }

    if (role === 'warden' && !phoneNumber) {
      triggerErrorShake();
      Alert.alert("Error", "Please provide your phone number");
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = Constants.expoConfig?.extra?.apiUrl ||
        (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          assignedHostel: hostelName,
          roomNumber: role === 'student' ? roomNumber : undefined,
          phoneNumber: role === 'warden' ? phoneNumber : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        router.replace('/(tabs)');
      } else {
        triggerErrorShake();
        Alert.alert("Signup Failed", data.details || data.error);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const { signInWithGoogle } = useGoogleAuth();

  const handleGoogleSignUp = async () => {
    if (!hostelName) {
      triggerErrorShake();
      Alert.alert("Error", `Please provide your ${role === 'student' ? 'Hostel Name' : 'Assigned Hostel'} before signing up with Google`);
      return;
    }

    if (role === 'student' && !roomNumber) {
      triggerErrorShake();
      Alert.alert("Error", "Please provide your room number before signing up with Google");
      return;
    }

    if (role === 'warden' && !phoneNumber) {
      triggerErrorShake();
      Alert.alert("Error", "Please provide your phone number before signing up with Google");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithGoogle();

      if (result.success && result.idToken) {
        const apiUrl = Constants.expoConfig?.extra?.apiUrl ||
          (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

        const response = await fetch(`${apiUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: result.idToken,
            role: role,
            assignedHostel: hostelName,
            roomNumber: role === 'student' ? roomNumber : undefined,
            phoneNumber: role === 'warden' ? phoneNumber : undefined
          })
        });

        const data = await response.json();

        if (response.ok) {
          login(data.user);
          Alert.alert("Success", `Welcome ${data.user.name}!`);
          router.replace('/(tabs)');
        } else {
          triggerErrorShake();
          Alert.alert("Google Signup Failed", data.details || data.error);
        }
      } else if (result.error) {
        Alert.alert('Google Sign Up Failed', result.error);
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      Alert.alert("Error", "Failed to sign up with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(100).duration(800).springify()}>
            <View style={styles.headerArea}>
              <FlipWords
                staticText="Issue"
                staticColor={colors.text}
                words={['Sence', 'Detect', 'Solve', 'Track']}
                colors={['#6366F1', '#EC4899', '#10B981', '#A855F7']} // Indigo, Pink, Green, Purple (Removed yellow)
                duration={2500}
                style={styles.brandName}
                wordStyle={{ fontSize: 48, fontWeight: '900', letterSpacing: 2 }}
              />
              <Text style={styles.tagline}>Smart Campus Management</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[animatedShakeStyle, styles.cardContainer]}
            entering={FadeInDown.delay(300).duration(800).springify()}
          >
            <View style={[styles.glassCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <View style={styles.cardContent}>

                <Animated.View entering={FadeInDown.delay(400).springify()}>
                  <View style={styles.tabBar}>
                    <TouchableOpacity
                      style={[
                        styles.tab,
                        role === 'student' && { backgroundColor: colors.surfaceHighlight, elevation: 2 }
                      ]}
                      onPress={() => setRole('student')}
                    >
                      <Text style={[styles.tabText, { color: role === 'student' ? colors.primary : '#64748B' }]}>Student</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.tab,
                        role === 'warden' && { backgroundColor: colors.surfaceHighlight, elevation: 2 }
                      ]}
                      onPress={() => setRole('warden')}
                    >
                      <Text style={[styles.tabText, { color: role === 'warden' ? colors.primary : '#64748B' }]}>Warden</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).springify()}>
                  <View>
                    <AnimatedInput
                      icon="person-outline"
                      placeholder="Full Name"
                      value={name}
                      onChangeText={setName}
                      isDark={isDark}
                    />
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(700).springify()}>
                  <View>
                    <AnimatedInput
                      icon="mail-outline"
                      placeholder="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      isDark={isDark}
                    />
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(800).springify()}>
                  <View>
                    <AnimatedInput
                      icon="lock-closed-outline"
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      isDark={isDark}
                      secureTextEntry
                    />
                    <View style={styles.strengthTrack}>
                      <Animated.View style={[styles.strengthBar, animatedStrengthStyle]} />
                    </View>
                  </View>
                </Animated.View>

                {role === 'warden' ? (
                  <Animated.View entering={FadeInDown.delay(900).springify()}>
                    <View>
                      <AnimatedInput
                        icon="shield-outline"
                        placeholder="Warden Secret Key"
                        value={hostelName} // Reusing hostelName for simplification of this specific edit
                        onChangeText={setHostelName}
                        secureTextEntry
                        isDark={isDark}
                      />
                    </View>
                  </Animated.View>
                ) : (
                  <>
                    <Animated.View entering={FadeInDown.delay(900).springify()}>
                      <View>
                        <AnimatedInput
                          icon="business-outline"
                          placeholder="Hostel Name"
                          value={hostelName}
                          onChangeText={setHostelName}
                          isDark={isDark}
                        />
                      </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(1000).springify()}>
                      <View>
                        <AnimatedInput
                          icon="home-outline"
                          placeholder="Room Number"
                          value={roomNumber}
                          onChangeText={setRoomNumber}
                          keyboardType="numeric"
                          isDark={isDark}
                        />
                      </View>
                    </Animated.View>
                  </>
                )}

                {role === 'warden' && (
                  <Animated.View entering={FadeInDown.delay(900).springify()}>
                    <AnimatedInput
                      icon="call-outline"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      isDark={isDark}
                      keyboardType="phone-pad"
                    />
                  </Animated.View>
                )}

                <Animated.View entering={FadeInDown.delay(1000).springify()}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleSignUp}
                    disabled={isLoading}
                    style={styles.submitWrapper}
                  >
                    <LinearGradient colors={[colors.primary, '#6366f1']} style={styles.gradientBtn}>
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.btnText}>INITIALIZE ACCOUNT</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1100).springify()}>
                  <View style={styles.divider}>
                    <View style={{ flex: 1, height: 1.5, backgroundColor: colors.borderMuted }} />
                    <Text style={styles.orText}>OR CONTINUE WITH</Text>
                    <View style={{ flex: 1, height: 1.5, backgroundColor: colors.borderMuted }} />
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1200).springify()}>
                  <TouchableOpacity
                    disabled={isLoading}
                    style={[
                      styles.googleBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      },
                      isLoading && { opacity: 0.6 }
                    ]}
                    onPress={handleGoogleSignUp}
                  >
                    <Image
                      source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }}
                      style={styles.googleIcon}
                    />
                    <Text style={[styles.googleText, { color: colors.text }]}>Continue with Google</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1300).springify()}>
                  <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginLink}>
                    <Text style={{ color: '#64748B' }}>
                      Already sensing issues? <Text style={{ color: colors.primary, fontWeight: '700' }}>Log In</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

              </View>
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center'
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 30
  },
  brandName: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  cardContainer: {
    borderRadius: 35,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  glassCard: {
    borderWidth: 1.5,
    // borderColor set via inline style
  },
  cardContent: {
    padding: 24,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 18,
    padding: 4,
    marginBottom: 20
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14
  },
  tabText: {
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase'
  },
  strengthTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: -8,
    marginBottom: 16,
    marginHorizontal: 10,
    overflow: 'hidden'
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2
  },
  submitWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientBtn: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 10
  },
  orText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1
  },
  googleBtn: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 10
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600'
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center'
  }
});