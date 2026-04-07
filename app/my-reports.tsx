import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './_layout';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeInDown,
    FadeInUp,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
import AnimatedBackground from '../components/AnimatedBackground';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

import type { Issue, ReportCardProps } from '@/types';

export default function MyReportsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);


    const fetchReports = async () => {
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');
            const res = await fetch(`${API_BASE_URL}/api/issues?userId=${user?.id}`);
            const data = await res.json();
            if (res.ok) {
                setIssues(data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    const renderItem = ({ item, index }: { item: Issue, index: number }) => {
        const isResolved = item.status === 'resolved';

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).duration(600).springify()}
                layout={LinearTransition.springify()}
                style={{ marginBottom: 20 }}
            >
                <ReportCard
                    item={item}
                    isResolved={isResolved}
                    colors={colors}
                    isDark={isDark}
                    onPress={() => router.push({ pathname: '/issue-details', params: { id: item._id } })}
                />
            </Animated.View>
        );
    };

    return (
        <AnimatedBackground>
            <View style={styles.container}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <Stack.Screen options={{
                    headerShown: true,
                    title: 'My Reports',
                    headerStyle: { backgroundColor: 'transparent' },
                    headerTransparent: true,
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                    headerTitleStyle: { fontWeight: '800', fontSize: 20 }
                }} />

                {loading && issues.length === 0 ? (
                    <View style={styles.center}>
                        {/* Simplified Loading State - Improving later to Skeleton if needed, but for now just ensure it doesn't look like a crash */}
                        <ActivityIndicator color={colors.primary} size="large" />
                        <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading reports...</Text>
                    </View>
                ) : (
                    <Animated.FlatList
                        data={issues}
                        renderItem={renderItem}
                        keyExtractor={(item: any) => item._id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                        ListEmptyComponent={
                            <Animated.View
                                entering={FadeInUp.delay(300).springify()}
                                style={styles.empty}
                            >
                                <View style={[styles.emptyIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                    <Ionicons name="clipboard-outline" size={80} color={isDark ? '#334155' : '#CBD5E1'} />
                                </View>
                                <Text style={[styles.emptyText, { color: colors.text }]}>No Reports Yet</Text>
                                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Issues you report will appear here.</Text>
                                <TouchableOpacity style={styles.reportNowBtn} onPress={() => router.push('/report')}>
                                    <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.reportNowGradient}>
                                        <Text style={styles.reportNowText}>Report an Issue</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        }
                    />
                )}
            </View>
        </AnimatedBackground>
    );
}

function ReportCard({ item, isResolved, colors, isDark, onPress }: ReportCardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <AnimatedTouchableOpacity
            activeOpacity={1}
            onPressIn={() => (scale.value = withSpring(0.97))}
            onPressOut={() => (scale.value = withSpring(1))}
            onPress={onPress}
            style={animatedStyle}
        >
            <BlurView
                intensity={isDark ? 30 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.glassCard,
                    {
                        borderColor: colors.glassBorder,
                    }
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                        <View style={[styles.typeIcon, { backgroundColor: isResolved ? colors.successBackground : colors.primary + '15' }]}>
                            <Ionicons name={isResolved ? "checkmark-circle" : "time"} size={20} color={isResolved ? colors.success : colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.cardInfo}>
                                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                <View style={[styles.dot, { backgroundColor: colors.textSecondary + '40' }]} />
                                <Ionicons name="business-outline" size={12} color={colors.textSecondary} />
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Room {item.roomNumber}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={[styles.badge, { backgroundColor: isResolved ? colors.successBackground : colors.warningBackground, marginBottom: 4 }]}>
                            <Text style={[styles.badgeText, { color: isResolved ? colors.success : colors.warning }]}>{item.status.toUpperCase()}</Text>
                        </View>
                        {item.status === 'in_progress' && (
                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                                {item.completionPercentage || 0}% DONE
                            </Text>
                        )}
                    </View>
                </View>

                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>

                <View style={[styles.footer, { borderTopColor: colors.borderMuted }]}>
                    <View style={styles.footerLeft}>
                        <Text style={[styles.viewDetails, { color: colors.primary }]}>Details</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                    </View>
                    <Ionicons name="attach-outline" size={18} color={item.photoBase64 ? colors.primary : colors.textSecondary + '40'} />
                </View>
            </BlurView>
        </AnimatedTouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    blob: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.15,
        ...(Platform.OS === 'web' ? { filter: 'blur(50px)' } : {})
    },
    blob1: { top: -50, right: -50 },
    blob2: {
        bottom: 50,
        left: -100,
        backgroundColor: '#EC4899',
        width: 400,
        height: 400
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 20, paddingTop: 110, paddingBottom: 100 },
    glassCard: {
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        borderWidth: 2,
        // Improved shadow/elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    titleContainer: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 10 },
    typeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    cardInfo: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 6 },
    cardSub: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
    cardDesc: { fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 16, opacity: 0.8 },
    footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1.5, paddingTop: 16, justifyContent: 'space-between' },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewDetails: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    emptyText: { fontSize: 24, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
    emptySub: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 35, opacity: 0.7 },
    reportNowBtn: { borderRadius: 24, overflow: 'hidden', width: '100%', elevation: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    reportNowGradient: { height: 65, justifyContent: 'center', alignItems: 'center' },
    reportNowText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
});


