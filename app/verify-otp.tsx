import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ScrollView,
    TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import Constants from 'expo-constants';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import AnimatedBackground from '../components/AnimatedBackground';
import FlipWords from '../components/FlipWords';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOtpScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);

    const router = useRouter();
    const auth = useAuth();
    const { colors, isDark } = useTheme();

    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text.length === 1 && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Auto-focus previous input on backspace if current is empty
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        if (!email) {
            Alert.alert('Error', 'Email address is missing');
            return;
        }

        setLoading(true);
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpString }),
            });

            const data = await res.json();

            if (res.ok) {
                auth.login(data.user);
                Alert.alert('Success', 'Email verified successfully!');
                router.replace('/(tabs)');
            } else {
                throw new Error(data.details || data.error || 'Verification failed');
            }
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || resending) return;

        if (!email) {
            Alert.alert('Error', 'Email address is missing');
            return;
        }

        setResending(true);
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                Alert.alert('Success', 'A new OTP has been sent to your email.');
                setCountdown(60); // Reset countdown
            } else {
                throw new Error(data.details || data.error || 'Failed to resend OTP');
            }
        } catch (error: any) {
            Alert.alert('Resend Failed', error.message);
        } finally {
            setResending(false);
        }
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
                                colors={['#6366F1', '#EC4899', '#10B981', '#A855F7']}
                                duration={2500}
                                wordStyle={styles.brandName}
                            />
                            <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                Security Verification
                            </Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(1000).springify()} style={styles.cardContainer}>
                        <BlurView
                            intensity={isDark ? 40 : 60}
                            tint={isDark ? 'dark' : 'light'}
                            style={[styles.glassCard, { borderColor: colors.glassBorder }]}
                        >
                            <View style={styles.cardContent}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={20} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 5 }}>Back</Text>
                                </TouchableOpacity>

                                <Text style={[styles.welcomeText, { color: colors.text }]}>Enter OTP</Text>
                                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                                    We've sent a 6-digit code to {email || 'your email'}. Please enter it below to verify your account.
                                </Text>

                                <Animated.View entering={FadeInDown.delay(600).springify()}>
                                    <View style={styles.otpContainer}>
                                        {otp.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                                style={[
                                                    styles.otpInput,
                                                    {
                                                        color: colors.text,
                                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                                                        borderColor: digit ? colors.primary : colors.border
                                                    }
                                                ]}
                                                value={digit}
                                                onChangeText={(text) => handleOtpChange(text, index)}
                                                onKeyPress={(e) => handleKeyPress(e, index)}
                                                keyboardType="number-pad"
                                                maxLength={1}
                                                selectTextOnFocus
                                            />
                                        ))}
                                    </View>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(800).springify()}>
                                    <TouchableOpacity onPress={handleVerify} disabled={loading} activeOpacity={0.9} style={styles.verifyBtnWrapper}>
                                        <LinearGradient
                                            colors={['#6366F1', '#4F46E5']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.verifyBtn}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.verifyText}>VERIFY CODE</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(1000).springify()}>
                                    <View style={styles.footer}>
                                        <Text style={{ color: '#94A3B8' }}>Didn't receive the code? </Text>
                                        <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending}>
                                            <Text style={[
                                                styles.resendLink,
                                                { color: countdown > 0 ? '#94A3B8' : colors.primary }
                                            ]}>
                                                {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            </View>
                        </BlurView>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
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
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    glassCard: {
        borderWidth: 1.5,
    },
    cardContent: {
        padding: 28,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 10,
        textAlign: 'center'
    },
    instructionText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    otpInput: {
        width: 45,
        height: 55,
        borderWidth: 1.5,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
    },
    verifyBtnWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    verifyBtn: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30
    },
    resendLink: {
        fontWeight: '700',
        marginLeft: 4
    },
});
