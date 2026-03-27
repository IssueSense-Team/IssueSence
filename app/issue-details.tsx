import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    Dimensions,
    StatusBar
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from './_layout';
import AnimatedBackground from '../components/AnimatedBackground';
import Fireworks from '../components/Fireworks';
import { Issue } from '@/types'; // Ensure you have this type or define it

const { width } = Dimensions.get('window');

export default function IssueDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();

    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchIssueDetails();
        }
    }, [id]);

    const fetchIssueDetails = async () => {
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');
            const res = await fetch(`${API_BASE_URL}/api/issues/${id}`);
            const data = await res.json();

            if (res.ok) {
                setIssue(data);
            } else {
                Alert.alert('Error', 'Could not load issue details');
                router.back();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!issue) return null;

    const isResolved = issue.status === 'resolved';



    return (
        <AnimatedBackground>
            {/* Fireworks celebration for resolved issues (student view only) */}
            {isResolved && user?.role === 'student' && <Fireworks count={6} />}
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Screen options={{
                headerShown: true,
                title: 'Issue Details', // Custom header layout
                headerTransparent: true,
                headerTintColor: colors.text, // Always white as we might have an image header
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backBtn, { backgroundColor: colors.surface }]}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Image Section */}
                <View style={styles.imageContainer}>
                    {(isResolved && issue.resolutionPhotoBase64) ? (
                        <Image source={{ uri: issue.resolutionPhotoBase64 }} style={styles.image} resizeMode="cover" />
                    ) : issue.photoBase64 ? (
                        <Image source={{ uri: issue.photoBase64 }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
                            <Ionicons name="image-outline" size={60} color="rgba(255,255,255,0.5)" />
                        </View>
                    )}
                    <LinearGradient
                        colors={['transparent', isDark ? '#151718' : '#F8F9FE']}
                        style={styles.imageOverlay}
                    />
                    {isResolved && issue.resolutionPhotoBase64 && (
                        <View style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>PROOF OF FIX</Text>
                        </View>
                    )}
                </View>

                {/* Content Body */}
                <View style={styles.body}>
                    <Animated.View entering={FadeInUp.delay(200).springify()}>
                        <View style={styles.headerRow}>
                            <View style={[styles.statusBadge, {
                                backgroundColor: isResolved ? colors.successBackground : colors.warningBackground
                            }]}>
                                <Ionicons
                                    name={isResolved ? "checkmark-circle" : "time"}
                                    size={16}
                                    color={isResolved ? colors.success : colors.warning}
                                />
                                <Text style={[styles.statusText, {
                                    color: isResolved ? colors.success : colors.warning
                                }]}>
                                    {issue.status.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={[styles.date, { color: colors.textSecondary }]}>
                                {new Date(issue.createdAt).toLocaleDateString()}
                            </Text>
                        </View>

                        <Text style={[styles.title, { color: colors.text }]}>{issue.name}</Text>

                        <View style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                            <View style={styles.locationItem}>
                                <Ionicons name="business" size={20} color={colors.primary} />
                                <Text style={[styles.locationText, { color: colors.text }]}>Hostel {issue.hostelNumber}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
                            <View style={styles.locationItem}>
                                <Ionicons name="bed" size={20} color={colors.primary} />
                                <Text style={[styles.locationText, { color: colors.text }]}>Room {issue.roomNumber}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(300).springify()} style={{ marginTop: 24 }}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DESCRIPTION</Text>
                        <Text style={[styles.description, { color: colors.text }]}>
                            {issue.description}
                        </Text>
                    </Animated.View>

                    {/* Warden Resolution Section */}
                    {isResolved && (
                        <Animated.View entering={FadeInUp.delay(400).springify()} style={[styles.resolutionCard, {
                            backgroundColor: colors.successBackground,
                            borderColor: colors.success + '40'
                        }]}>
                            <View style={styles.resHeader}>
                                <Ionicons name="checkmark-done-circle" size={24} color={colors.success} />
                                <Text style={[styles.resTitle, { color: colors.success }]}>Resolved</Text>
                            </View>
                            {issue.resolutionRemark && (
                                <Text style={[styles.resRemark, { color: colors.text }]}>
                                    "{issue.resolutionRemark}"
                                </Text>
                            )}
                            {issue.resolvedAt && (
                                <Text style={[styles.resDate, { color: colors.textSecondary }]}>
                                    Fixed on {new Date(issue.resolvedAt).toLocaleDateString()}
                                </Text>
                            )}
                        </Animated.View>
                    )}

                    {/* Warden Action Button */}
                    {user?.role === 'warden' && !isResolved && (
                        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.actionContainer}>
                            <TouchableOpacity
                                style={styles.resolveBtn}
                                activeOpacity={0.9}
                                onPress={() => router.push({ pathname: '/resolve-issue', params: { id: issue._id } })}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientBtn}
                                >
                                    <Text style={styles.resolveBtnText}>MARK AS RESOLVED</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>
            </ScrollView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: 50, paddingTop: 0 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    imageContainer: { width: '100%', height: 300, position: 'relative' },
    image: { width: '100%', height: '100%' },
    placeholderImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
    body: { padding: 24, marginTop: -40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    date: { fontSize: 13, fontWeight: '600' },
    title: { fontSize: 28, fontWeight: '800', lineHeight: 34, marginBottom: 24 },
    locationCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 2, padding: 16 },
    locationItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    locationText: { fontSize: 15, fontWeight: '700' },
    divider: { width: 1, height: '100%', marginHorizontal: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
    description: { fontSize: 16, lineHeight: 26, opacity: 0.9 },
    resolutionCard: { marginTop: 30, padding: 20, borderRadius: 20, borderWidth: 2 },
    resHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    resTitle: { fontSize: 18, fontWeight: '800' },
    resRemark: { fontSize: 16, fontStyle: 'italic', marginBottom: 12, opacity: 0.9 },
    resImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, borderWidth: 2 },
    resDate: { fontSize: 12, opacity: 0.7 },
    actionContainer: { marginTop: 40 },
    resolveBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    gradientBtn: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    resolveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});
