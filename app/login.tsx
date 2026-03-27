import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Image,
    StatusBar,
    ScrollView,
    Modal,
    TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useGoogleAuth } from '../utils/googleAuth';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedBackground from '../components/AnimatedBackground';
import FlipWords from '../components/FlipWords';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // OTP Modal State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const otpInputRefs = React.useRef<Array<TextInput | null>>([]);

    const router = useRouter();
    const auth = useAuth();
    const { colors, isDark } = useTheme();
    const { signInWithGoogle, request: googleRequest } = useGoogleAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                Alert.alert('Server Error', 'The server returned an invalid response.');
                return;
            }

            if (res.ok) {
                auth.login(data.user);
            } else {
                if (data.requireOtp) {
                    setUnverifiedEmail(data.email);
                    Alert.alert('Email Not Verified', data.details || 'Please verify your email.');
                    setShowOtpModal(true);
                } else if (!data.user) {
                    throw new Error(data.details || data.error || 'Login failed');
                }
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text.length === 1 && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (e: any, index: number) => {
        // Auto-focus previous input on backspace if current is empty
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
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setIsVerifying(true);
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: unverifiedEmail, otp: otpString }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowOtpModal(false);
                auth.login(data.user);
                Alert.alert('Success', 'Email verified successfully!');
                router.replace('/(tabs)');
            } else {
                throw new Error(data.details || data.error || 'Verification failed');
            }
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message || 'Invalid OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const result = await signInWithGoogle();
        if (result.success && result.idToken) {
            try {
                const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                    (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

                const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: result.idToken })
                });

                const data = await res.json();

                if (res.ok) {
                    auth.login(data.user);
                    Alert.alert("Success", `Welcome ${data.user.name}`);
                } else {
                    if (data.error === 'Role required' || res.status === 400) {
                        Alert.alert("Account Setup", "Please sign up to select your role.", [
                            { text: "Go to Signup", onPress: () => router.push('/signup') }
                        ]);
                    } else {
                        Alert.alert("Google Login Error", data.details || "Failed to authenticate");
                    }
                }
            } catch (err) {
                Alert.alert("Error", "Failed to connect to server");
            }
        } else if (result.error) {
            Alert.alert('Google Sign In Failed', result.error);
        }
        setLoading(false);
    };

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
                        <View style={styles.header}>
                            <FlipWords
                                staticText="Issue"
                                staticColor={colors.text}
                                words={['Sence', 'Detect', 'Solve', 'Track']}
                                colors={['#6366F1', '#EC4899', '#10B981', '#A855F7']} // Indigo, Pink, Green, Purple (Removed yellow)
                                duration={2500}
                                wordStyle={styles.brandName}
                            />
                            <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                Smart Campus Management
                            </Text>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(400).duration(1000).springify()}
                        style={styles.cardContainer}
                    >
                        <LinearGradient
                            colors={isDark ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.3)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBorder}
                        >
                            {Platform.OS === 'ios' ? (
                                <BlurView
                                    intensity={isDark ? 40 : 60}
                                    tint={isDark ? 'dark' : 'light'}
                                    style={styles.glassCard}
                                >
                                    <View style={styles.cardContent}>
                                        <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome Back</Text>

                                        <Animated.View entering={FadeInDown.delay(600).springify()}>
                                            <View>
                                                <AnimatedInput
                                                    icon="mail-unread-outline"
                                                    placeholder="Email Address"
                                                    value={email}
                                                    onChangeText={setEmail}
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    isDark={isDark}
                                                />
                                            </View>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(700).springify()}>
                                            <View>
                                                <AnimatedInput
                                                    icon="lock-closed-outline"
                                                    placeholder="Password"
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    secureTextEntry
                                                    isDark={isDark}
                                                />
                                            </View>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(800).springify()}>
                                            <TouchableOpacity style={styles.forgotBtn}>
                                                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
                                            </TouchableOpacity>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(900).springify()}>
                                            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
                                                <LinearGradient
                                                    colors={['#6366F1', '#4F46E5']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.loginBtn}
                                                >
                                                    {loading ? (
                                                        <ActivityIndicator color="#fff" />
                                                    ) : (
                                                        <Text style={styles.loginText}>SIGN IN</Text>
                                                    )}
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(1000).springify()}>
                                            <View style={styles.divider}>
                                                <View style={[styles.line, { backgroundColor: colors.borderMuted }]} />
                                                <Text style={styles.orText}>SECURE ACCESS</Text>
                                                <View style={[styles.line, { backgroundColor: colors.borderMuted }]} />
                                            </View>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(1100).springify()}>
                                            <TouchableOpacity
                                                disabled={!googleRequest}
                                                style={[
                                                    styles.googleBtn,
                                                    {
                                                        backgroundColor: colors.surface,
                                                        borderColor: colors.border
                                                    },
                                                    !googleRequest && { opacity: 0.6 }
                                                ]}
                                                onPress={handleGoogleSignIn}
                                            >
                                                <Image
                                                    source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }}
                                                    style={styles.googleIcon}
                                                />
                                                <Text style={[styles.googleText, { color: colors.text }]}>Continue with Google</Text>
                                            </TouchableOpacity>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(1200).springify()}>
                                            <View style={styles.footer}>
                                                <Text style={{ color: '#94A3B8' }}>Don't have an account? </Text>
                                                <TouchableOpacity onPress={() => router.push('/signup')}>
                                                    <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </Animated.View>
                                    </View>
                                </BlurView>
                            ) : (
                                <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)' }]}>
                                    <View style={styles.cardContent}>
                                        <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome Back</Text>

                                        <Animated.View entering={FadeInDown.delay(600).springify()}>
                                            <View>
                                                <AnimatedInput
                                                    icon="mail-unread-outline"
                                                    placeholder="Email Address"
                                                    value={email}
                                                    onChangeText={setEmail}
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    isDark={isDark}
                                                />
                                            </View>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(700).springify()}>
                                            <View>
                                                <AnimatedInput
                                                    icon="lock-closed-outline"
                                                    placeholder="Password"
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    secureTextEntry
                                                    isDark={isDark}
                                                />
                                            </View>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(800).springify()}>
                                            <TouchableOpacity style={styles.forgotBtn}>
                                                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
                                            </TouchableOpacity>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(900).springify()}>
                                            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
                                                <LinearGradient
                                                    colors={['#6366F1', '#4F46E5']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.loginBtn}
                                                >
                                                    {loading ? (
                                                        <ActivityIndicator color="#fff" />
                                                    ) : (
                                                        <Text style={styles.loginText}>SIGN IN</Text>
                                                    )}
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(1000).springify()}>
                                            <View style={styles.divider}>
                                                <View style={[styles.line, { backgroundColor: colors.borderMuted }]} />
                                                <Text style={styles.orText}>SECURE ACCESS</Text>
                                                <View style={[styles.line, { backgroundColor: colors.borderMuted }]} />
                                            </View>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(1100).springify()}>
                                            <TouchableOpacity
                                                disabled={!googleRequest}
                                                style={[
                                                    styles.googleBtn,
                                                    {
                                                        backgroundColor: colors.surface,
                                                        borderColor: colors.border
                                                    },
                                                    !googleRequest && { opacity: 0.6 }
                                                ]}
                                                onPress={handleGoogleSignIn}
                                            >
                                                <Image
                                                    source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }}
                                                    style={styles.googleIcon}
                                                />
                                                <Text style={[styles.googleText, { color: colors.text }]}>Continue with Google</Text>
                                            </TouchableOpacity>
                                        </Animated.View>

                                        <Animated.View entering={FadeInDown.delay(1200).springify()}>
                                            <View style={styles.footer}>
                                                <Text style={{ color: '#94A3B8' }}>Don't have an account? </Text>
                                                <TouchableOpacity onPress={() => router.push('/signup')}>
                                                    <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </Animated.View>
                                    </View>
                                </View>
                            )}
                        </LinearGradient>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* OTP Verification Modal */}
            <Modal
                visible={showOtpModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowOtpModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View
                        style={[
                            styles.modalCard,
                            {
                                borderColor: colors.glassBorder,
                                borderWidth: 1,
                                backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.97)'
                            }
                        ]}
                    >
                        <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>

                        <Text style={[styles.welcomeText, { color: colors.text }]}>Enter OTP</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            We've sent a 6-digit code to {unverifiedEmail}. Please enter it below.
                        </Text>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { otpInputRefs.current[index] = ref; }}
                                    style={[
                                        styles.otpInput,
                                        {
                                            color: colors.text,
                                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                            borderColor: digit ? colors.primary : colors.border
                                        }
                                    ]}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleVerifyOtp}
                            disabled={isVerifying}
                            style={[styles.submitWrapper, { width: '100%', marginTop: 20 }]}
                        >
                            <LinearGradient colors={[colors.primary, '#6366f1']} style={styles.gradientBtn}>
                                {isVerifying ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Text style={styles.btnText}>VERIFY CODE</Text>
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center'
    },
    header: {
        alignItems: 'center',
        marginBottom: 40
    },
    brandName: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    cardContainer: {
        borderRadius: 35,
        overflow: 'hidden',
    },
    gradientBorder: {
        padding: 2, // This creates the border thickness
        borderRadius: 35,
    },
    glassCard: {
        borderRadius: 33, // Slightly smaller than border
        overflow: 'hidden',
        flex: 1,
    },
    cardContent: {
        padding: 28,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 30,
        textAlign: 'center'
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 24
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '600'
    },
    loginBtn: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loginText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30
    },
    line: {
        flex: 1,
        height: 1
    },
    orText: {
        marginHorizontal: 16,
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
        borderWidth: 1.5
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30
    },
    signupLink: {
        fontWeight: '700',
        marginLeft: 4
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 9999,
        elevation: 100
    },
    modalCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 10
    },
    otpInput: {
        width: 40,
        height: 50,
        borderWidth: 1.5,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
    },
    submitWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
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
    }
});
