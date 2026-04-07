import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
    Dimensions
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './_layout';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function UpdateProgressScreen() {
    const { id, currentPercentage } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [stepDescription, setStepDescription] = useState('');
    const [completionPercentage, setCompletionPercentage] = useState(
        currentPercentage ? currentPercentage.toString() : '0'
    );
    const [loading, setLoading] = useState(false);
    const [focusedDesc, setFocusedDesc] = useState(false);
    const [focusedPerc, setFocusedPerc] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(50)).current;
    const blob1Pos = useRef(new Animated.Value(0)).current;
    const blob2Pos = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance Animations
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideUp, { toValue: 0, tension: 20, friction: 8, useNativeDriver: true }),
        ]).start();

        // Infinite Background Loop
        const createLoop = (anim: Animated.Value, toVal: number, duration: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: toVal, duration, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
                ])
            );
        };
        createLoop(blob1Pos, 30, 7000).start();
        createLoop(blob2Pos, -40, 9000).start();
    }, []);

    const handleUpdate = async () => {
        const percNum = parseInt(completionPercentage, 10);
        if (!stepDescription) {
            Alert.alert('Missing Info', 'Please describe the step completed.');
            return;
        }
        if (isNaN(percNum) || percNum < 0 || percNum > 100) {
            Alert.alert('Invalid Input', 'Percentage must be between 0 and 100.');
            return;
        }

        setLoading(true);
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');
            const res = await fetch(`${API_BASE_URL}/api/issues/${id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wardenId: user?.id,
                    stepDescription,
                    completionPercentage: percNum
                }),
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('Server returned an invalid response.');
            }

            if (res.ok) {
                Alert.alert('Success', 'Progress updated successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                throw new Error(data.error || 'Failed to update progress');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Screen options={{
                headerShown: true,
                title: 'Update Progress',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerShadowVisible: false
            }} />

            {/* 🌌 Animated Background Elements */}
            <Animated.View style={[styles.blob, styles.blob1, { transform: [{ translateY: blob1Pos }], backgroundColor: colors.primary }]} />
            <Animated.View style={[styles.blob, styles.blob2, { transform: [{ translateX: blob2Pos }] }]} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>
                        <Text style={[styles.title, { color: colors.text }]}>Log Progress</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Keep the student updated on step-by-step progress.</Text>

                        {/* Step Description Input */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>STEP COMPLETED</Text>
                        <View style={[styles.inputWrapper, {
                            backgroundColor: colors.surface,
                            borderColor: focusedDesc ? colors.primary : colors.glassBorder,
                            minHeight: 120
                        }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="E.g., Sent plumber to check the pipes..."
                                placeholderTextColor={colors.textMuted}
                                value={stepDescription}
                                onChangeText={setStepDescription}
                                multiline
                                onFocus={() => setFocusedDesc(true)}
                                onBlur={() => setFocusedDesc(false)}
                            />
                        </View>

                        {/* Percentage Input */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>COMPLETION PERCENTAGE (0-100)</Text>
                        <View style={[styles.inputWrapper, {
                            backgroundColor: colors.surface,
                            borderColor: focusedPerc ? colors.primary : colors.glassBorder,
                            paddingVertical: 15
                        }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="0 to 100"
                                placeholderTextColor={colors.textMuted}
                                value={completionPercentage}
                                onChangeText={setCompletionPercentage}
                                keyboardType="numeric"
                                onFocus={() => setFocusedPerc(true)}
                                onBlur={() => setFocusedPerc(false)}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity activeOpacity={0.9} style={styles.submitBtnWrapper} onPress={handleUpdate} disabled={loading}>
                            <LinearGradient colors={['#3B82F6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>UPDATE PROGRESS</Text>
                                        <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.15 },
    blob1: { top: -50, right: -50 },
    blob2: { bottom: 50, left: -100, backgroundColor: '#8B5CF6', width: 400, height: 400 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    title: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
    subtitle: { fontSize: 16, fontWeight: '500', marginBottom: 30 },
    label: { fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1.5, marginLeft: 4 },
    inputWrapper: { borderRadius: 24, borderWidth: 2, padding: 20, marginBottom: 25 },
    input: { fontSize: 16, fontWeight: '500', lineHeight: 24, textAlignVertical: 'top' },
    submitBtnWrapper: { borderRadius: 24, overflow: 'hidden', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, marginTop: 10 },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 65, gap: 10 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
