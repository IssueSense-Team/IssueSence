import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Platform,
    StatusBar,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from './_layout';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Reanimated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    interpolateColor,
} from 'react-native-reanimated';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

interface ChartData {
    label: string;
    solveCount: number;
    avgTime: number; // in hours
    fullLabel: string;
}

const ActiveBarChart = ({ data, colors, isDark, onSelect, activeIndex }: {
    data: ChartData[],
    colors: any,
    isDark: boolean,
    onSelect: (index: number) => void,
    activeIndex: number
}) => {
    const maxSolve = Math.max(...data.map(d => d.solveCount), 1);
    const maxTime = Math.max(...data.map(d => d.avgTime), 1);

    return (
        <View style={styles.chartArea}>
            <View style={styles.barsContainer}>
                {data.map((item, index) => {
                    const isActive = index === activeIndex;
                    const solveHeight = (item.solveCount / maxSolve) * 120;
                    const timeHeight = (item.avgTime / maxTime) * 120;

                    return (
                        <Pressable
                            key={index}
                            onPress={() => onSelect(index)}
                            style={styles.barGroupWrapper}
                        >
                            <View style={styles.barStack}>
                                {/* Solve Bar */}
                                <Reanimated.View
                                    style={[
                                        styles.bar,
                                        {
                                            height: solveHeight,
                                            backgroundColor: isActive ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                                            borderTopLeftRadius: 6,
                                            borderTopRightRadius: 6,
                                            width: 14,
                                            opacity: isActive ? 1 : 0.6
                                        }
                                    ]}
                                />
                                {/* Time Bar (Secondary color) */}
                                <Reanimated.View
                                    style={[
                                        styles.bar,
                                        {
                                            height: timeHeight,
                                            backgroundColor: isActive ? '#FF9500' : (isDark ? 'rgba(255,149,0,0.1)' : 'rgba(255,149,0,0.05)'),
                                            borderTopLeftRadius: 6,
                                            borderTopRightRadius: 6,
                                            width: 8,
                                            opacity: isActive ? 1 : 0.4
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[
                                styles.barLabelText,
                                {
                                    color: isActive ? colors.text : colors.textSecondary,
                                    fontWeight: isActive ? 'bold' : '500'
                                }
                            ]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Grid lines */}
            <View style={styles.gridLines}>
                {[0, 0.5, 1].map((p, i) => (
                    <View key={i} style={[styles.gridLine, { bottom: p * 120, borderTopColor: colors.borderMuted, opacity: 0.2 }]} />
                ))}
            </View>
        </View>
    );
};

export default function AnalysisScreen() {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    const data: ChartData[] = useMemo(() => [
        { label: 'Mon', solveCount: 4, avgTime: 5.2, fullLabel: 'Monday' },
        { label: 'Tue', solveCount: 7, avgTime: 4.8, fullLabel: 'Tuesday' },
        { label: 'Wed', solveCount: 5, avgTime: 6.1, fullLabel: 'Wednesday' },
        { label: 'Thu', solveCount: 8, avgTime: 3.9, fullLabel: 'Thursday' },
        { label: 'Fri', solveCount: 6, avgTime: 4.5, fullLabel: 'Friday' },
        { label: 'Sat', solveCount: 3, avgTime: 2.1, fullLabel: 'Saturday' },
        { label: 'Sun', solveCount: 2, avgTime: 1.5, fullLabel: 'Sunday' },
    ], []);

    const [activeIndex, setActiveIndex] = useState(data.length - 1);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        inProgress: 0,
        avgResolutionTime: 0
    });

    useEffect(() => {
        fetchStats();
        setActiveIndex(6); // Default to Sunday or current day
    }, []);

    const fetchStats = async () => {
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const query = user?.role === 'warden'
                ? `?role=warden&hostel=${user.assignedHostel}`
                : `?role=student&userId=${user?.id}`;

            const res = await fetch(`${API_BASE_URL}/api/stats${query}`);
            if (res.ok) {
                const data = await res.json();
                setStats({
                    total: data.total || 0,
                    pending: data.pending || 0,
                    resolved: data.resolved || 0,
                    inProgress: data.inProgress || 0,
                    avgResolutionTime: data.avgResolutionTime || 0
                });
            }
        } catch (error) {
            console.log('Error fetching analysis stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const activeData = data[activeIndex];

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Efficiency Analytics</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Issues vs Resolution Time</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Shadcn Style Active Bar Card */}
                    <Reanimated.View entering={FadeInUp.delay(100).springify()} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Performance</Text>
                                <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Real-time tracking of solves & time</Text>
                            </View>
                            <View style={styles.headerStats}>
                                <View style={styles.headerStatItem}>
                                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.headerStatText, { color: colors.textSecondary }]}>Solves</Text>
                                </View>
                                <View style={styles.headerStatItem}>
                                    <View style={[styles.dot, { backgroundColor: '#FF9500' }]} />
                                    <Text style={[styles.headerStatText, { color: colors.textSecondary }]}>Time (h)</Text>
                                </View>
                            </View>
                        </View>

                        <ActiveBarChart
                            data={data}
                            colors={colors}
                            isDark={isDark}
                            activeIndex={activeIndex}
                            onSelect={setActiveIndex}
                        />

                        {/* Interactive Tooltip-style Footer */}
                        <View style={[styles.chartFooter, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <View>
                                <Text style={[styles.footerDay, { color: colors.text }]}>{activeData.fullLabel}</Text>
                                <Text style={[styles.footerDesc, { color: colors.textSecondary }]}>Insights for this day</Text>
                            </View>
                            <View style={styles.footerValues}>
                                <View style={styles.footerValBox}>
                                    <Text style={[styles.footerValLabel, { color: colors.textSecondary }]}>Solved</Text>
                                    <Text style={[styles.footerValText, { color: colors.primary }]}>{activeData.solveCount}</Text>
                                </View>
                                <View style={[styles.footerValDivider, { backgroundColor: colors.borderMuted }]} />
                                <View style={styles.footerValBox}>
                                    <Text style={[styles.footerValLabel, { color: colors.textSecondary }]}>Avg Time</Text>
                                    <Text style={[styles.footerValText, { color: '#FF9500' }]}>{activeData.avgTime}h</Text>
                                </View>
                            </View>
                        </View>
                    </Reanimated.View>

                    {/* Overall Summary Details */}
                    <View style={styles.summaryGrid}>
                        <Reanimated.View entering={FadeInDown.delay(200).springify()} style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                                <Ionicons name="checkmark-done-circle" size={24} color="#34C759" />
                            </View>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Solved</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.resolved}</Text>
                        </Reanimated.View>

                        <Reanimated.View entering={FadeInDown.delay(300).springify()} style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                                <Ionicons name="timer" size={24} color="#FF9500" />
                            </View>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Efficiency</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.avgResolutionTime}h/issue</Text>
                        </Reanimated.View>
                    </View>

                    {/* Pro-Tips / Insights */}
                    <Reanimated.View entering={FadeInDown.delay(400).springify()} style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <View style={styles.insightHeader}>
                            <Ionicons name="bulb" size={20} color={colors.primary} />
                            <Text style={[styles.insightTitle, { color: colors.text }]}>Optimization Insights</Text>
                        </View>
                        <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                            {stats.avgResolutionTime < 5
                                ? "Excellent responsiveness! Your resolution time is better than 85% of other sectors."
                                : "Focus on quicker plumbing resolution to improve overall performance metrics."}
                        </Text>
                    </Reanimated.View>
                </ScrollView>
            </View>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    chartCard: {
        borderRadius: 32,
        borderWidth: 2,
        marginBottom: 20,
        overflow: 'hidden',
    },
    chartHeader: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    chartSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    headerStats: {
        flexDirection: 'row',
        gap: 12,
    },
    headerStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    headerStatText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    chartArea: {
        height: 180,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 140,
        zIndex: 2,
    },
    barGroupWrapper: {
        alignItems: 'center',
        width: 40,
    },
    barStack: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 120, // Match the grid lines max height
        gap: 2,
        marginBottom: 10,
    },
    bar: {
        borderRadius: 6,
    },
    barLabelText: {
        fontSize: 11,
    },
    gridLines: {
        ...StyleSheet.absoluteFillObject,
        height: 120,
        top: 24, // Shifted down slightly to avoid overlap with header
        left: 24,
        right: 24,
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        borderTopWidth: 1,
    },
    chartFooter: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerDay: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerDesc: {
        fontSize: 12,
    },
    footerValues: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    footerValBox: {
        alignItems: 'flex-end',
    },
    footerValLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    footerValText: {
        fontSize: 18,
        fontWeight: '900',
    },
    footerValDivider: {
        width: 1,
        height: 24,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        borderWidth: 2,
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    insightCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 2,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    insightTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    insightText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
