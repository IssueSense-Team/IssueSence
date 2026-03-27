import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
    Dimensions
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from './_layout';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ResolveIssueScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [remark, setRemark] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);

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

    // Helper to determine media types safely
    const getMediaTypes = () => {
        // @ts-ignore
        return ImagePicker.MediaType ? ImagePicker.MediaType.Images : ImagePicker.MediaTypeOptions.Images;
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need camera access to take proof photos.');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: getMediaTypes(),
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled) {
                setPhoto('data:image/jpeg;base64,' + result.assets[0].base64);
            }
        } catch (error) {
            Alert.alert(
                'Camera Unavailable',
                'Could not open camera. Would you like to pick from Gallery instead?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Gallery', onPress: pickImageFromGallery }
                ]
            );
        }
    };

    const pickImageFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: getMediaTypes(),
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setPhoto('data:image/jpeg;base64,' + result.assets[0].base64);
        }
    };

    const handleResolve = async () => {
        if (!remark || !photo) {
            Alert.alert('Missing Info', 'Please add a remark and take a proof photo.');
            return;
        }

        setLoading(true);
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');
            const res = await fetch(`${API_BASE_URL}/api/issues/${id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wardenId: user?.id,
                    remark,
                    photoBase64: photo
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
                Alert.alert('Success', 'Issue marked as RESOLVED!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                throw new Error(data.error || 'Failed to resolve');
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
                title: 'Resolve Issue',
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
                        <Text style={[styles.title, { color: colors.text }]}>Mark as Resolved</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Upload proof and add closing remarks.</Text>

                        {/* Photo Section */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.photoBox, {
                                backgroundColor: colors.surface,
                                borderColor: photo ? colors.success : colors.borderMuted
                            }]}
                            onPress={pickImage}
                        >
                            {photo ? (
                                <Image source={{ uri: photo }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.placeholder}>
                                    <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name="camera" size={40} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.photoText, { color: colors.primary }]}>Tap to Take Proof Photo</Text>
                                    <TouchableOpacity onPress={pickImageFromGallery}>
                                        <Text style={[styles.galleryText, { color: colors.textSecondary }]}>or pick from gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {photo && (
                                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                                    <Ionicons name="close-circle" size={28} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        {/* Remark Input */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>CLOSING REMARKS</Text>
                        <View style={[styles.inputWrapper, {
                            backgroundColor: colors.surface,
                            borderColor: focused ? colors.primary : colors.glassBorder
                        }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Describe how the issue was resolved..."
                                placeholderTextColor={colors.textMuted}
                                value={remark}
                                onChangeText={setRemark}
                                multiline
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity activeOpacity={0.9} style={styles.submitBtnWrapper} onPress={handleResolve} disabled={loading}>
                            <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>CONFIRM RESOLUTION</Text>
                                        <Ionicons name="checkmark-done" size={20} color="#fff" />
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
    blob2: { bottom: 50, left: -100, backgroundColor: '#EC4899', width: 400, height: 400 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    title: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
    subtitle: { fontSize: 16, fontWeight: '500', marginBottom: 30 },
    photoBox: {
        height: 250,
        borderRadius: 28,
        marginBottom: 30,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed'
    },
    placeholder: { alignItems: 'center' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    photoText: { fontSize: 16, fontWeight: '800', marginBottom: 5 },
    galleryText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    previewImage: { width: '100%', height: '100%' },
    removePhoto: { position: 'absolute', top: 15, right: 15, backgroundColor: '#fff', borderRadius: 14 },
    label: { fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1.5, marginLeft: 4 },
    inputWrapper: { borderRadius: 24, borderWidth: 2, padding: 20, marginBottom: 35, minHeight: 120 },
    input: { fontSize: 16, fontWeight: '500', lineHeight: 24, textAlignVertical: 'top' },
    submitBtnWrapper: { borderRadius: 24, overflow: 'hidden', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 65, gap: 10 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});

