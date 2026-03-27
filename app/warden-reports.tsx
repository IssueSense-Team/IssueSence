import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Platform,
    Image,
    Alert,
    Animated,
    StatusBar,
    Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import Reanimated, {
    FadeInDown,
    FadeInUp,
    FadeIn,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import AnimatedBackground from '../components/AnimatedBackground';

const { width } = Dimensions.get('window');

import type { Issue } from '@/types';

export default function WardenReportsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        fetchIssues();

        // Entrance Animations
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideUp, { toValue: 0, tension: 20, friction: 8, useNativeDriver: true }),
        ]).start();
    }, [user]);

    const fetchIssues = async () => {
        if (!user || user.role !== 'warden' || !user.assignedHostel) return;

        if (!refreshing) setLoading(true);

        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');
            const response = await fetch(`${API_BASE_URL}/api/issues?hostel=${user.assignedHostel}`);
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                setIssues(data);
            } else {
                Alert.alert('Error', 'Unable to load reports. Please try again.');
            }
        } catch (error) {
            Alert.alert('Connection Error', 'Could not connect to server.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchIssues();
    };

    const filteredIssues = issues.filter((issue: Issue) => {
        if (activeTab === 'pending') {
            return issue.status === 'pending' || issue.status === 'in_progress';
        }
        return issue.status === 'resolved';
    });

    const renderIssueCard = ({ item, index }: { item: Issue, index: number }) => {
        const isResolved = item.status === 'resolved';

        return (
            <Reanimated.View
                entering={FadeInDown.delay(index * 100).springify()}
                layout={LinearTransition.springify()}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/issue-details', params: { id: item._id } })}
                    style={[styles.glassCard, { backgroundColor: 'transparent', borderColor: colors.glassBorder }]}
                >
                    <BlurView
                        intensity={isDark ? 30 : 60}
                        tint={isDark ? 'dark' : 'light'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.roomBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.roomText, { color: colors.primary }]}>ROOM {item.roomNumber}</Text>
                            </View>
                            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>

                        <View style={styles.cardContent}>
                            <Text style={[styles.issueTitle, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.issueDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                                {item.description}
                            </Text>
                        </View>

                        <View style={[styles.cardFooter, { borderTopColor: colors.borderMuted }]}>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: isResolved ? colors.successBackground : colors.dangerBackground }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: isResolved ? colors.success : colors.danger }
                                ]}>
                                    {item.status.toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.actionRow}>
                                <Text style={[styles.tapText, { color: colors.primary }]}>{isResolved ? 'View' : 'Manage'}</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                            </View>
                        </View>
                    </BlurView>
                </TouchableOpacity>
            </Reanimated.View>
        );
    };

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.borderMuted }]}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{user?.assignedHostel} Reports</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Hostel issues management</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.tab, activeTab === 'pending' ? styles.activeTab : {
                            backgroundColor: colors.surface,
                            borderColor: colors.borderMuted
                        }]}
                        onPress={() => setActiveTab('pending')}
                    >
                        {activeTab === 'pending' && <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                        <Text style={[styles.tabText, activeTab === 'pending' ? { color: '#fff' } : { color: colors.textSecondary }]}>
                            Pending ({issues.filter((i: any) => i.status !== 'resolved').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.tab, activeTab === 'resolved' ? styles.activeTab : {
                            backgroundColor: colors.surface,
                            borderColor: colors.borderMuted
                        }]}
                        onPress={() => setActiveTab('resolved')}
                    >
                        {activeTab === 'resolved' && <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                        <Text style={[styles.tabText, activeTab === 'resolved' ? { color: '#fff' } : { color: colors.textSecondary }]}>
                            Resolved ({issues.filter((i: any) => i.status === 'resolved').length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
                ) : (
                    <FlatList
                        data={filteredIssues}
                        renderItem={renderIssueCard}
                        keyExtractor={(item: any) => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                        ListEmptyComponent={
                            <Reanimated.View entering={FadeInUp.delay(300).springify()} style={styles.emptyState}>
                                <View style={[styles.emptyIconBox, { backgroundColor: colors.borderMuted }]}>
                                    <Ionicons name={activeTab === 'pending' ? "sparkles" : "clipboard-outline"} size={80} color={isDark ? '#334155' : '#CBD5E1'} />
                                </View>
                                <Text style={[styles.emptyText, { color: colors.text }]}>No {activeTab} issues found</Text>
                                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                                    {activeTab === 'pending' ? "Great job! All clear for now." : "No resolved history yet."}
                                </Text>
                            </Reanimated.View>
                        }
                    />
                )}
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.15 },
    blob1: { top: -50, right: -50 },
    blob2: { bottom: 50, left: -100, backgroundColor: '#EC4899', width: 400, height: 400 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: Platform.OS === 'android' ? 40 : 20 },
    backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 15, fontWeight: '600' },
    tabContainer: { flexDirection: 'row', padding: 16, gap: 12 },
    tab: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
    activeTab: { borderWidth: 0, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
    tabText: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
    listContent: { padding: 16, paddingBottom: 100 },
    glassCard: {
        borderRadius: 28,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        overflow: 'hidden',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    roomBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    roomText: { fontWeight: '900', fontSize: 11, letterSpacing: 1 },
    dateText: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
    cardContent: { marginBottom: 18 },
    issueTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
    issueDesc: { fontSize: 15, lineHeight: 22, fontWeight: '500', opacity: 0.8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, paddingTop: 15 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tapText: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
    emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    emptyText: { fontSize: 24, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
    emptySubText: { fontSize: 16, textAlign: 'center', lineHeight: 24, opacity: 0.7 }
});

