import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
    Animated,
    Dimensions,
    StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
    const { user, login } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(50)).current;
    const blob1Pos = useRef(new Animated.Value(0)).current;
    const blob2Pos = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance Animation
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
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

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user?.id,
                    name: name
                })
            });

            const data = await res.json();

            if (res.ok) {
                login(data.user); // Update local context
                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                throw new Error(data.details || 'Failed to update');
            }

        } catch (e: any) {
            Alert.alert('Update Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Screen options={{
                headerShown: true,
                title: 'Edit Profile',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerShadowVisible: false
            }} />

            {/* 🌌 Animated Background Elements */}
            <Animated.View style={[styles.blob, styles.blob1, { transform: [{ translateY: blob1Pos }], backgroundColor: colors.primary }]} />
            <Animated.View style={[styles.blob, styles.blob2, { transform: [{ translateX: blob2Pos }] }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Animated.View style={[styles.glassCard, {
                        backgroundColor: colors.surface,
                        borderColor: colors.glassBorder,
                        opacity: fadeAnim, transform: [{ translateY: slideUp }]
                    }]}>
                        <View style={styles.avatarPlaceholder}>
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                style={styles.avatarGradient}
                            >
                                <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : '?'}</Text>
                            </LinearGradient>
                        </View>

                        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                        <Animated.View style={[styles.inputBox, {
                            backgroundColor: colors.inputBackground,
                            borderColor: focusedField === 'name' ? colors.primary : 'transparent',
                            shadowOpacity: focusedField === 'name' ? 0.2 : 0
                        }]}>
                            <Ionicons name="person-outline" size={20} color={focusedField === 'name' ? colors.primary : '#94A3B8'} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={colors.textMuted}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </Animated.View>

                        <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                        <View style={[styles.inputBox, styles.disabledInput, { backgroundColor: colors.surfaceHighlight }]}>
                            <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                            <TextInput
                                style={[styles.input, { color: '#94A3B8' }]}
                                value={user?.email}
                                editable={false}
                            />
                            <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
                        </View>
                        <Text style={styles.helperText}>Email cannot be changed.</Text>

                        <TouchableOpacity onPress={handleSave} disabled={loading} activeOpacity={0.9} style={styles.saveBtnWrapper}>
                            <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>SAVE CHANGES</Text>}
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
    blob2: { bottom: 50, left: -100, backgroundColor: '#EC4899', width: 400, height: 400 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    glassCard: {
        borderRadius: 35,
        padding: 28,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.1,
        shadowRadius: 25
    },
    avatarPlaceholder: { alignItems: 'center', marginBottom: 35 },
    avatarGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
    avatarText: { fontSize: 40, fontWeight: '900', color: '#fff' },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
    inputBox: { flexDirection: 'row', alignItems: 'center', height: 62, borderRadius: 20, paddingHorizontal: 18, marginBottom: 20, borderWidth: 1.5 },
    input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
    disabledInput: { borderColor: 'transparent', opacity: 0.8 },
    helperText: { fontSize: 12, color: '#94A3B8', marginTop: -15, marginBottom: 25, marginLeft: 4, fontWeight: '500' },
    saveBtnWrapper: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
    saveBtn: { height: 62, justifyContent: 'center', alignItems: 'center' },
    saveText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
