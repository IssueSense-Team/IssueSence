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
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import Reanimated from 'react-native-reanimated';
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
  const [wardenSecretKey, setWardenSecretKey] = useState('');
  const [role, setRole] = useState<'student' | 'warden'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // OTP inline card state
  const [showOtpCard, setShowOtpCard] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = React.useRef<Array<TextInput | null>>([]);

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

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        triggerErrorShake();
        Alert.alert("Error", "Please fill name, email and password first.");
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => setStep(1);

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

    if (role === 'warden' && !wardenSecretKey) {
      triggerErrorShake();
      Alert.alert("Error", "Please provide the Warden Secret Key to register as a warden.");
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = Constants.expoConfig?.extra?.apiUrl ||
        (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

      const payload: any = {
        name,
        email,
        password,
        role,
        assignedHostel: hostelName
      };

      if (role === 'student') {
        payload.roomNumber = roomNumber;
      } else {
        payload.phoneNumber = phoneNumber;
        payload.wardenSecretKey = wardenSecretKey; // Send the secret key to backend for validation later if needed
      }

      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Signup Response Status:", response.status);
      console.log("Signup Response Data:", JSON.stringify(data));

      if (response.ok || data.requireOtp) {
        if (data.requireOtp) {
          console.log("Showing OTP card for:", data.email);
          setShowOtpCard(true);
        } else if (data.user) {
          login(data.user);
          router.replace('/(tabs)');
        } else {
          Alert.alert("Success", data.message || "Account created successfully");
          router.replace('/login');
        }
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

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }
    setIsVerifying(true);
    try {
      const apiUrl = Constants.expoConfig?.extra?.apiUrl ||
        (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp: otpString }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user);
        router.replace('/(tabs)');
      } else {
        throw new Error(data.details || data.error || 'Verification failed');
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
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
    if (role === 'warden' && !wardenSecretKey) {
      triggerErrorShake();
      Alert.alert("Error", "Please provide the Warden Secret Key to register as a warden.");
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
            role,
            assignedHostel: hostelName,
            roomNumber: role === 'student' ? roomNumber : undefined,
            phoneNumber: role === 'warden' ? phoneNumber : undefined,
            wardenSecretKey: role === 'warden' ? wardenSecretKey : undefined
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
      Alert.alert("Error", "Failed to sign up with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== RENDER ==========
  return (
    <AnimatedBackground>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {showOtpCard ? (
            /* ===== OTP VERIFICATION CARD ===== */
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.cardContainer}>
              <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <View style={[styles.glassCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.cardContent}>

                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                      <View style={{
                        width: 72, height: 72, borderRadius: 36,
                        backgroundColor: colors.primary + '22',
                        justifyContent: 'center', alignItems: 'center', marginBottom: 14
                      }}>
                        <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
                      </View>
                      <Text style={[styles.welcomeText, { color: colors.text }]}>Check Your Email</Text>
                      <Text style={{ color: colors.textSecondary ?? '#94A3B8', textAlign: 'center', fontSize: 14, lineHeight: 22, marginTop: 4 }}>
                        A 6-digit code was sent to{' '}
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>{email}</Text>
                      </Text>
                    </View>

                    <View style={styles.otpContainer}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => { otpInputRefs.current[index] = ref; }}
                          style={[
                            styles.otpInput,
                            {
                              color: colors.text,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                              borderColor: digit ? colors.primary : (colors.border ?? '#334155'),
                            }
                          ]}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          selectTextOnFocus
                          caretHidden
                        />
                      ))}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleVerifyOtp}
                      disabled={isVerifying}
                      style={[styles.submitWrapper, { marginTop: 20 }]}
                    >
                      <LinearGradient colors={[colors.primary, '#6366f1']} style={styles.gradientBtn}>
                        {isVerifying ? <ActivityIndicator color="#fff" /> : (
                          <>
                            <Text style={styles.btnText}>VERIFY & CONTINUE</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => { setShowOtpCard(false); setOtp(['', '', '', '', '', '']); }}
                      style={{ marginTop: 18, alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.textSecondary ?? '#94A3B8', fontSize: 14 }}>{'← Back to Signup'}</Text>
                    </TouchableOpacity>

                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          ) : (
            /* ===== SIGNUP FORM ===== */
            <>
              <Animated.View entering={FadeInDown.delay(100).duration(800).springify()}>
                <View style={styles.headerArea}>
                  <FlipWords
                    staticText="Issue"
                    staticColor={colors.text}
                    words={['Sence', 'Detect', 'Solve', 'Track']}
                    colors={['#6366F1', '#EC4899', '#10B981', '#A855F7']}
                    duration={2500}
                    wordStyle={styles.brandName}
                  />
                  <Text style={styles.tagline}>Smart Campus Management</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
                <Animated.View style={[animatedShakeStyle, styles.cardContainer]}>
                  <LinearGradient
                    colors={isDark ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.3)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBorder}
                  >
                    <BlurView
                      intensity={isDark ? 40 : 60}
                      tint={isDark ? 'dark' : 'light'}
                      style={styles.glassCard}
                    >
                      <View style={styles.cardContent}>

                        <Text style={[styles.welcomeText, { color: colors.text }]}>
                          {step === 1 ? 'Create Account' : 'Profile Specifics'}
                        </Text>

                        {step === 1 ? (
                          <Reanimated.View entering={FadeInDown.duration(600)}>
                            <View style={styles.tabBar}>
                              <TouchableOpacity
                                style={[styles.tab, role === 'student' && { backgroundColor: colors.surfaceHighlight, elevation: 2 }]}
                                onPress={() => setRole('student')}
                              >
                                <Text style={[styles.tabText, { color: role === 'student' ? colors.primary : '#64748B' }]}>Student</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.tab, role === 'warden' && { backgroundColor: colors.surfaceHighlight, elevation: 2 }]}
                                onPress={() => setRole('warden')}
                              >
                                <Text style={[styles.tabText, { color: role === 'warden' ? colors.primary : '#64748B' }]}>Warden</Text>
                              </TouchableOpacity>
                            </View>

                            <AnimatedInput icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} isDark={isDark} />
                            <AnimatedInput icon="mail-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" isDark={isDark} />

                            <View>
                              <AnimatedInput icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} isDark={isDark} secureTextEntry />
                              <View style={styles.strengthTrack}>
                                <Animated.View style={[styles.strengthBar, animatedStrengthStyle]} />
                              </View>
                            </View>

                            <TouchableOpacity activeOpacity={0.9} onPress={handleNext} style={styles.submitWrapper}>
                              <LinearGradient colors={[colors.primary, '#6366f1']} style={styles.gradientBtn}>
                                <Text style={styles.btnText}>CONTINUE</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                              </LinearGradient>
                            </TouchableOpacity>
                          </Reanimated.View>
                        ) : (
                          <Reanimated.View entering={FadeInDown.duration(600)}>
                            <TouchableOpacity onPress={handleBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                              <Ionicons name="arrow-back" size={18} color={colors.primary} />
                              <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 5 }}>Back</Text>
                            </TouchableOpacity>

                            {role === 'warden' ? (
                              <>
                                <AnimatedInput icon="business-outline" placeholder="Assigned Hostel (e.g. NC12)" value={hostelName} onChangeText={setHostelName} isDark={isDark} />
                                <AnimatedInput icon="shield-outline" placeholder="Warden Secret Key" value={wardenSecretKey} onChangeText={setWardenSecretKey} secureTextEntry isDark={isDark} />
                                <AnimatedInput icon="call-outline" placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} isDark={isDark} keyboardType="phone-pad" />
                              </>
                            ) : (
                              <>
                                <AnimatedInput icon="business-outline" placeholder="Hostel Name" value={hostelName} onChangeText={setHostelName} isDark={isDark} />
                                <AnimatedInput icon="home-outline" placeholder="Room Number" value={roomNumber} onChangeText={setRoomNumber} keyboardType="numeric" isDark={isDark} />
                              </>
                            )}

                            <TouchableOpacity activeOpacity={0.9} onPress={handleSignUp} disabled={isLoading} style={styles.submitWrapper}>
                              <LinearGradient colors={[colors.primary, '#6366f1']} style={styles.gradientBtn}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : (
                                  <>
                                    <Text style={styles.btnText}>SIGN UP</Text>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                  </>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>
                          </Reanimated.View>
                        )}

                        <View style={styles.divider}>
                          <View style={{ flex: 1, height: 1.5, backgroundColor: colors.borderMuted }} />
                          <Text style={styles.orText}>OR</Text>
                          <View style={{ flex: 1, height: 1.5, backgroundColor: colors.borderMuted }} />
                        </View>

                        <TouchableOpacity
                          disabled={isLoading}
                          style={[styles.googleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isLoading && { opacity: 0.6 }]}
                          onPress={handleGoogleSignUp}
                        >
                          <Image source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} style={styles.googleIcon} />
                          <Text style={[styles.googleText, { color: colors.text }]}>Google Registration</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginLink}>
                          <Text style={{ color: '#64748B' }}>
                            Already sensing issues? <Text style={{ color: colors.primary, fontWeight: '700' }}>Log In</Text>
                          </Text>
                        </TouchableOpacity>

                      </View>
                    </BlurView>
                  </LinearGradient>
                </Animated.View>
              </Animated.View>
            </>
          )}

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 35,
  },
  glassCard: {
    borderRadius: 33,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center'
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
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 10
  },
  otpInput: {
    width: 44,
    height: 54,
    borderWidth: 2,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  }
});