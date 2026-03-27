import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    Animated,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Image,
    Easing
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import AnimatedBackground from '../../components/AnimatedBackground';
import { StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

interface Notification {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    issueId: string;
    type?: 'alert' | 'success' | 'info';
}



import type { NotificationCardProps, StatCardProps, AnimatedActionCardProps } from '@/types';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const NotificationCard = ({ notif, index, cardAnim, pulseAnim, isDark, colors, onPress }: NotificationCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const getIconInfo = () => {
        const title = notif.title.toLowerCase();
        if (title.includes('resolved') || title.includes('success')) return { name: 'checkmark-circle', color: '#34C759', bg: isDark ? 'rgba(52, 199, 89, 0.15)' : '#EDF9F0' };
        if (title.includes('priority') || title.includes('urgent')) return { name: 'alert-circle', color: '#FF3B30', bg: isDark ? 'rgba(255, 59, 48, 0.15)' : '#FFF1F0' };
        return { name: 'notifications', color: colors.primary, bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F0F2FF' };
    };

    const iconInfo = getIconInfo();

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
        >
            <Animated.View
                style={[
                    styles.notifCard,
                    {
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        borderColor: colors.borderMuted,
                        borderWidth: 1,
                    },
                    {
                        transform: [
                            { scale: !notif.isRead ? Animated.multiply(scaleAnim, pulseAnim) : scaleAnim }
                        ],
                    }
                ]}
            >
                <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <View style={[styles.notifIcon, { backgroundColor: iconInfo.bg }]}>
                    <Ionicons
                        name={iconInfo.name as any}
                        size={22}
                        color={iconInfo.color}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={[styles.notifTitle, { color: colors.text, fontSize: 15, fontWeight: '700' }]}>{notif.title}</Text>
                        {!notif.isRead && (
                            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                    </View>
                    <Text style={[styles.notifMsg, { color: colors.textSecondary, fontSize: 13, lineHeight: 18 }]} numberOfLines={2}>
                        {notif.message}
                    </Text>
                    <View style={styles.notifFooter}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.notifTime, { color: colors.textSecondary, fontSize: 11, marginLeft: 4 }]}>
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Animated.View>
        </TouchableOpacity>
    );
};

const ShimmerEffect = ({ shimmerAnim }: { shimmerAnim: Animated.Value }) => (
    <Animated.View
        style={[
            styles.shimmerContainer,
            {
                transform: [{
                    translateX: shimmerAnim.interpolate({
                        inputRange: [-1, 1],
                        outputRange: [-width, width]
                    })
                }, { skewX: '-20deg' }]
            }
        ]}
    >
        <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        />
    </Animated.View>
);

const AnimatedActionCard = ({ children, onPress, style, gradient = false, colors: gradientColors, shimmerAnim }: AnimatedActionCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }], overflow: 'hidden' }]}>
                <ShimmerEffect shimmerAnim={shimmerAnim} />
                {gradient && (
                    <LinearGradient
                        colors={gradientColors as any}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

const StatCard = ({ icon, value, label, color, index, statCardAnim, isDark, colors, shimmerAnim }: StatCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const animatedStyle = {
        transform: [{ scale: scaleAnim }],
        shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.3]
        }),
        shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [5, 15]
        })
    };

    return (
        <AnimatedTouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.cardWrapper}
        >
            <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardBorder}
            >
                <Animated.View style={[styles.statCard, animatedStyle, {
                    shadowColor: color,
                    overflow: 'hidden',
                    backgroundColor: 'transparent'
                }]}>
                    <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <ShimmerEffect shimmerAnim={shimmerAnim} />
                    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon as any} size={24} color={color} />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={[styles.statValue, { color: isDark ? colors.text : color }]}>{value}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
                    </View>
                </Animated.View>
            </LinearGradient>
        </AnimatedTouchableOpacity>
    );
};

export default function HomeScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    // Stats state
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        highPriority: 0
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Live Notification Listener
    const { notification: latestNotification } = useNotifications(user?.id);

    // Auto-refresh when new notification arrives
    useEffect(() => {
        if (latestNotification) {
            console.log('Dashboard received live notification, refreshing...');
            fetchStats();
            fetchNotifications();
        }
    }, [latestNotification]);

    // Animations
    const shimmerAnim = useRef(new Animated.Value(-1)).current;

    // Enhanced animations for cards
    const statCardAnims = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    const notifCardAnims = useRef<Animated.Value[]>([]).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Carousel refs and animations
    const scrollX = useRef(new Animated.Value(0)).current;
    const carouselRef = useRef<ScrollView>(null);
    const cardWidth = width * 0.8; // Increased side visibility
    const spacing = 12;
    const snapInterval = cardWidth + spacing;
    const numCards = 5; // Updated from 4
    const [activeCardIndex, setActiveCardIndex] = useState(0);

    // Auto-scroll effect
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeCardIndex + 1) % numCards;
            setActiveCardIndex(nextIndex);
            carouselRef.current?.scrollTo({
                x: nextIndex * snapInterval,
                animated: true,
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [activeCardIndex]);

    // Subtle bounce effect for unread notifications
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    useEffect(() => {
        // Shimmer effect loop
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Shimmer effect loop

        if (user?.id) {
            console.log('HomeScreen: Fetching data for user', user.id);
            fetchStats();
            fetchNotifications();
        } else {
            console.log('HomeScreen: No user ID found');
        }
    }, [user]);

    if (!user) return null;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Animate notification cards when they change
    useEffect(() => {
        // Initialize animations for new notifications
        while (notifCardAnims.length < notifications.length) {
            notifCardAnims.push(new Animated.Value(0));
        }

        // Animate in new notifications
        Animated.stagger(100,
            notifCardAnims.slice(0, notifications.length).map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                })
            )
        ).start();
    }, [notifications.length]);

    const fetchStats = async () => {
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const query = user?.role === 'warden'
                ? `?role=warden&hostel=${user.assignedHostel}`
                : `?role=student&userId=${user?.id}`;

            const res = await fetch(`${API_BASE_URL}/api/stats${query}`);
            const data = await res.json();
            if (res.ok) {
                setStats({
                    total: data.total || 0,
                    pending: data.pending || 0,
                    resolved: data.resolved || 0,
                    highPriority: data.inProgress || 0
                });
            }
        } catch (error) {
            console.log('Error fetching stats:', error);
        }
    };

    const fetchNotifications = async () => {
        if (!user?.id) return;
        setIsLoadingNotifs(true);
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            const res = await fetch(`${API_BASE_URL}/api/notifications?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.log('Error fetching notifications');
        } finally {
            setIsLoadingNotifs(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        await fetchNotifications();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => logout() }
        ]);
    };

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading dashboard...</Text>
            </View>
        );
    }



    const renderWardenDashboard = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
                <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Alerts</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Immediate updates for your hostel area</Text>
                </View>
                <TouchableOpacity onPress={fetchNotifications} style={[styles.refreshBtn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="sync" size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {isLoadingNotifs ? (
                <View style={{ height: 100, justifyContent: 'center' }}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={[styles.emptyState, {
                    backgroundColor: colors.surface,
                    borderColor: colors.glassBorder
                }]}>
                    <View style={[styles.emptyIconBg, { backgroundColor: isDark ? '#1E293B' : '#F5F5F5' }]}>
                        <Ionicons name="notifications-off" size={32} color={colors.icon} />
                    </View>
                    <Text style={[styles.emptyText, { color: colors.text }]}>All caught up!</Text>
                    <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>No new notifications for Hostel {user.assignedHostel}</Text>
                </View>
            ) : (
                notifications.map((notif, index) => (
                    <Reanimated.View key={notif._id} entering={FadeInDown.delay(100 * index).springify()}>
                        <NotificationCard
                            notif={notif}
                            index={index}
                            cardAnim={notifCardAnims[index] || new Animated.Value(1)}
                            pulseAnim={pulseAnim}
                            isDark={isDark}
                            colors={colors}
                            onPress={() => router.push({ pathname: '/issue-details', params: { id: notif.issueId } })}
                        />
                    </Reanimated.View>
                ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 30, color: colors.text }]}>Quick Actions</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Shortcut to common tasks</Text>
            <View style={styles.actionGrid}>
                <AnimatedActionCard
                    onPress={() => router.push('/warden-reports')}
                    gradient={true}
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.actionCardMain}
                    shimmerAnim={shimmerAnim}
                >
                    <View style={[styles.actionCardContent, { backgroundColor: 'transparent' }]}>
                        <Ionicons name="list" size={32} color="#fff" />
                        <Text style={styles.actionTextMain}>View Reports</Text>
                        <Text style={styles.actionSubTextMain}>Manage {user.assignedHostel} Issues</Text>
                    </View>
                </AnimatedActionCard>

                <AnimatedActionCard
                    style={[styles.actionCardSecondary, {
                        backgroundColor: colors.surface,
                        borderColor: colors.glassBorder
                    }]}
                    onPress={() => Alert.alert('Coming Soon')}
                    shimmerAnim={shimmerAnim}
                >
                    <Ionicons name="people" size={24} color={colors.primary} />
                    <Text style={[styles.actionTextSec, { color: colors.text }]}>Students</Text>
                </AnimatedActionCard>

                <AnimatedActionCard
                    style={[styles.actionCardSecondary, {
                        backgroundColor: colors.surface,
                        borderColor: colors.glassBorder
                    }]}
                    onPress={() => Alert.alert('Coming Soon')}
                    shimmerAnim={shimmerAnim}
                >
                    <Ionicons name="stats-chart" size={24} color={colors.primary} />
                    <Text style={[styles.actionTextSec, { color: colors.text }]}>History</Text>
                </AnimatedActionCard>
            </View>
        </View>
    );

    const renderStudentDashboard = () => (
        <View style={styles.sectionContainer}>
            {notifications.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Updates</Text>
                    <ScrollView
                        style={{ maxHeight: 280 }}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                    >
                        {notifications.map((notif, index) => (
                            <Reanimated.View key={notif._id} entering={FadeInDown.delay(100 * index).springify()}>
                                <NotificationCard
                                    notif={notif}
                                    index={index}
                                    cardAnim={notifCardAnims[index] || new Animated.Value(1)}
                                    pulseAnim={pulseAnim}
                                    isDark={isDark}
                                    colors={colors}
                                    onPress={() => router.push({ pathname: '/issue-details', params: { id: notif.issueId } })}
                                />
                            </Reanimated.View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dashboard Actions</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Report or track your hostel concerns</Text>

            <AnimatedActionCard
                style={[styles.heroButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/report')}
                shimmerAnim={shimmerAnim}
            >
                <View style={styles.heroContent}>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>Report an Issue</Text>
                        <Text style={styles.heroSubtitle}>Something broken? Let us know.</Text>
                        <View style={[styles.heroBtn, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                            <Text style={[styles.heroBtnText, { color: colors.primary }]}>Report Now</Text>
                            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                        </View>
                    </View>
                    <Reanimated.View
                        entering={FadeInDown.delay(600).springify()}
                        style={{
                            position: 'absolute',
                            right: -10,
                            bottom: -10,
                            transform: [{ rotate: '-10deg' }]
                        }}
                    >
                        <Ionicons name="construct" size={120} color="rgba(255,255,255,0.15)" />
                    </Reanimated.View>
                    <View style={styles.heroIconFallback}>
                        <Ionicons name="build" size={60} color="#fff" />
                    </View>
                </View>
            </AnimatedActionCard>

            <View style={styles.rowActions}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.smallActionWrapper}
                    onPress={() => router.push('/my-reports')}
                >
                    <LinearGradient
                        colors={isDark ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.2)']}
                        style={styles.smallActionBorder}
                    >
                        <View style={[styles.smallActionCard, { backgroundColor: colors.surface }]}>
                            <View style={[styles.smallActionIcon, { backgroundColor: '#007AFF' + '15' }]}>
                                <Ionicons name="list" size={22} color="#007AFF" />
                            </View>
                            <Text style={[styles.smallActionLabel, { color: colors.text }]}>My Reports</Text>
                            <View style={[styles.smallActionArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.smallActionWrapper}
                    onPress={() => Alert.alert('Coming Soon')}
                >
                    <LinearGradient
                        colors={isDark ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.2)']}
                        style={styles.smallActionBorder}
                    >
                        <View style={[styles.smallActionCard, { backgroundColor: colors.surface }]}>
                            <View style={[styles.smallActionIcon, { backgroundColor: '#8F5CEB' + '15' }]}>
                                <Ionicons name="notifications" size={22} color="#8F5CEB" />
                            </View>
                            <Text style={[styles.smallActionLabel, { color: colors.text }]}>Updates</Text>
                            <View style={[styles.smallActionArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.smallActionWrapper}
                    onPress={() => router.push('/support-center')}
                >
                    <LinearGradient
                        colors={isDark ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.2)']}
                        style={styles.smallActionBorder}
                    >
                        <View style={[styles.smallActionCard, { backgroundColor: colors.surface }]}>
                            <View style={[styles.smallActionIcon, { backgroundColor: '#00C853' + '15' }]}>
                                <Ionicons name="headset" size={22} color="#00C853" />
                            </View>
                            <Text style={[styles.smallActionLabel, { color: colors.text }]}>Support</Text>
                            <View style={[styles.smallActionArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={[styles.container]}>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                >
                    {/* Glass Header */}
                    <Reanimated.View
                        entering={FadeInDown.delay(100).duration(800).springify()}
                        style={styles.headerContainer}
                    >
                        <View style={styles.glassHeader}>
                            <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                            <View style={[styles.glassHeaderInner, { borderColor: colors.borderMuted }]}>
                                <View style={styles.headerTopRow}>
                                    <View>
                                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()},</Text>
                                        <Text style={[styles.userName, { color: colors.text }]}>{user.name || 'User'} ✨</Text>
                                        <View style={styles.statusBadge}>
                                            <View style={[styles.statusDot, { backgroundColor: stats.pending > 0 ? '#FF9500' : '#34C759' }]} />
                                            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                                                {stats.pending > 0 ? `${stats.pending} issues pending resolution` : 'All issues resolved!'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[styles.profileBtn, {
                                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                                            borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'
                                        }]}
                                        onPress={() => router.push('/(tabs)/profile')}
                                    >
                                        <Text style={[styles.profileInitials, { color: colors.primary }]}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.locationBadge, {
                                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'
                                }]}>
                                    <Ionicons name={user.role === 'warden' ? 'business' : 'home'} size={14} color={colors.primary} />
                                    <Text style={[styles.locationText, { color: colors.primary }]}>
                                        {user.role === 'warden' ? `Warden • ${user.assignedHostel || 'No Hostel'}` : `Student • Room ${user.roomNumber || 'Not Set'}`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Reanimated.View>

                    <View style={styles.bodyContent}>
                        {/* Floating Stats */}
                        <View style={styles.statsRow}>
                            <Reanimated.View entering={FadeInDown.delay(200).springify()}>
                                <StatCard icon="file-tray-full" value={stats.total} label="Total" color={colors.primary} index={0} statCardAnim={statCardAnims[0]} isDark={isDark} colors={colors} shimmerAnim={shimmerAnim} />
                            </Reanimated.View>
                            <Reanimated.View entering={FadeInDown.delay(300).springify()}>
                                <StatCard icon="time" value={stats.pending} label="Pending" color="#FF9500" index={1} statCardAnim={statCardAnims[1]} isDark={isDark} colors={colors} shimmerAnim={shimmerAnim} />
                            </Reanimated.View>
                            <Reanimated.View entering={FadeInDown.delay(400).springify()}>
                                <StatCard icon="checkmark-circle" value={stats.resolved} label="Done" color="#34C759" index={2} statCardAnim={statCardAnims[2]} isDark={isDark} colors={colors} shimmerAnim={shimmerAnim} />
                            </Reanimated.View>
                        </View>

                        {/* Amazon-style Moving Cards with Slide Pop & Push Back - Student Only */}
                        {user.role === 'student' && (
                            <Reanimated.View entering={FadeInDown.delay(500).springify()}>
                                <View style={styles.carouselContainer}>
                                    <Animated.ScrollView
                                        ref={carouselRef as any}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={[styles.carouselPadding, {
                                            paddingHorizontal: (width - cardWidth) / 2, // Centers the first and last cards
                                            gap: spacing
                                        }]}
                                        snapToInterval={snapInterval}
                                        snapToAlignment="center"
                                        decelerationRate="fast"
                                        onScroll={Animated.event(
                                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                            { useNativeDriver: false } // Layout properties like width cannot use native driver
                                        )}
                                        onMomentumScrollEnd={(e) => {
                                            const index = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
                                            setActiveCardIndex(index);
                                        }}
                                        scrollEventThrottle={16}
                                    >
                                        {[
                                            {
                                                id: 1,
                                                bg: '#6366F1',
                                                icon: 'stats-chart',
                                                tag: 'ANALYTICS',
                                                title: 'Issue Overview',
                                                desc: 'Live breakdown of solves vs pending.',
                                                link: 'Explore Deep Dive'
                                            },
                                            {
                                                id: 2,
                                                bg: '#8B5CF6',
                                                icon: 'notifications',
                                                tag: 'NEW',
                                                title: 'Push Notifications',
                                                desc: 'Get real-time updates on your reported issues.',
                                                link: 'Learn more'
                                            },
                                            {
                                                id: 3,
                                                bg: '#EC4899',
                                                icon: 'shield-checkmark',
                                                tag: 'SECURITY',
                                                title: 'Safe Campus',
                                                desc: 'Report any suspicious activity for quick action.',
                                                link: 'Safety Tips'
                                            },
                                            {
                                                id: 4,
                                                bg: '#F59E0B',
                                                icon: 'color-palette',
                                                tag: 'UPDATE',
                                                title: 'New UI Design',
                                                desc: 'Experience the fresh glassmorphism look.',
                                                link: "What's new"
                                            },
                                            {
                                                id: 5,
                                                bg: '#10B981',
                                                icon: 'headset',
                                                tag: 'SUPPORT',
                                                title: 'Student Support',
                                                desc: 'Need help? Contact our support team directly.',
                                                link: 'Get help'
                                            }
                                        ].map((item, index) => {
                                            const inputRange = [
                                                (index - 1) * snapInterval,
                                                index * snapInterval,
                                                (index + 1) * snapInterval,
                                            ];

                                            const scale = scrollX.interpolate({
                                                inputRange,
                                                outputRange: [0.9, 1, 0.9],
                                                extrapolate: 'clamp',
                                            });

                                            const opacity = scrollX.interpolate({
                                                inputRange,
                                                outputRange: [0.7, 1, 0.7],
                                                extrapolate: 'clamp',
                                            });

                                            return (
                                                <Animated.View
                                                    key={item.id}
                                                    style={{
                                                        transform: [{ scale }],
                                                        opacity,
                                                    }}
                                                >
                                                    <TouchableOpacity
                                                        activeOpacity={0.9}
                                                        style={[styles.movingCard, { backgroundColor: item.bg }]}
                                                        onPress={() => {
                                                            if (item.tag === 'ANALYTICS') {
                                                                router.push('/analysis');
                                                            } else if (item.tag === 'SUPPORT') {
                                                                router.push('/support-center');
                                                            }
                                                        }}
                                                    >
                                                        <View style={styles.movingCardHeader}>
                                                            <Ionicons name={item.icon as any} size={20} color="#fff" />
                                                            <Text style={styles.movingCardTag}>{item.tag}</Text>
                                                        </View>

                                                        <Text style={styles.movingCardTitle}>{item.title}</Text>
                                                        <Text style={styles.movingCardDesc}>{item.desc}</Text>
                                                        <View style={styles.movingCardFooter}>
                                                            <Text style={styles.movingCardLink}>{item.link}</Text>
                                                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                                                        </View>
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            );
                                        })}
                                    </Animated.ScrollView>
                                </View>

                                {/* Carousel Pagination Dots */}
                                <View style={styles.paginationContainer}>
                                    {Array.from({ length: numCards }).map((_, i) => {
                                        const dotOpacity = scrollX.interpolate({
                                            inputRange: [(i - 1) * snapInterval, i * snapInterval, (i + 1) * snapInterval],
                                            outputRange: [0.4, 1, 0.4],
                                            extrapolate: 'clamp',
                                        });
                                        const dotWidth = scrollX.interpolate({
                                            inputRange: [(i - 1) * snapInterval, i * snapInterval, (i + 1) * snapInterval],
                                            outputRange: [6, 20, 6],
                                            extrapolate: 'clamp',
                                        });
                                        return (
                                            <Animated.View
                                                key={i}
                                                style={[
                                                    styles.paginationDot,
                                                    {
                                                        width: dotWidth,
                                                        opacity: dotOpacity,
                                                        backgroundColor: colors.primary
                                                    }
                                                ]}
                                            />
                                        );
                                    })}
                                </View>
                            </Reanimated.View>
                        )}

                        {/* Resolution Progress Visualization - Student Only */}
                        {user.role === 'student' && (
                            <Reanimated.View entering={FadeInDown.delay(600).springify()}>
                                <View style={[styles.progressCard, {
                                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                                }]}>
                                    <View style={styles.progressHeader}>
                                        <Text style={[styles.progressTitle, { color: colors.text }]}>Resolution Rate</Text>
                                        <Text style={[styles.progressPercent, { color: colors.primary }]}>
                                            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                                        </Text>
                                    </View>
                                    <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    backgroundColor: colors.primary,
                                                    width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
                                        {stats.resolved} of {stats.total} issues resolved officially
                                    </Text>
                                </View>
                            </Reanimated.View>
                        )}


                        {/* Main Content */}
                        <Reanimated.View entering={FadeInDown.delay(500).springify()}>
                            {user.role === 'warden' ? renderWardenDashboard() : renderStudentDashboard()}
                        </Reanimated.View>
                    </View>
                </ScrollView>
            </View >
        </AnimatedBackground >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    blob: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.15
    },
    blob1: {
        top: -50,
        right: -50
    },
    blob2: {
        bottom: 50,
        left: -100,
        width: 400,
        height: 400
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    glassHeader: {
        borderRadius: 24,
        marginTop: 10,
        overflow: 'hidden',
    },
    glassHeaderInner: {
        padding: 20,
        borderWidth: 2,
        borderRadius: 24,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
    },
    userName: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -1,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    profileInitials: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        gap: 6,
        marginTop: 4,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '700',
    },
    bodyContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    cardWrapper: {
        width: (width - 40 - 24) / 3,
        flex: 1,
    },
    statCardBorder: {
        borderRadius: 20,
        padding: 1.5,
    },
    statCard: {
        borderRadius: 18.5,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        minHeight: 110,
    },
    unreadBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        position: 'absolute',
        top: 12,
        right: 12,
    },
    statContent: {
        alignItems: 'center',
        marginTop: 8,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.7,
        textAlign: 'center',
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 20,
        opacity: 0.7,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    refreshBtn: {
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    carouselContainer: {
        marginHorizontal: -20,
        marginBottom: 24,
    },
    carouselPadding: {
        paddingHorizontal: 20,
        gap: 16,
    },
    movingCard: {
        width: width * 0.8,
        borderRadius: 24,
        padding: 20,
        height: 160,
        justifyContent: 'space-between',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    movingCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    movingCardTag: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    movingCardTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        marginTop: 8,
    },
    movingCardDesc: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
        lineHeight: 18,
    },
    movingCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    movingCardLink: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    heroUICard: {
        display: 'none',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: -8,
        marginBottom: 24,
    },
    paginationDot: {
        height: 6,
        borderRadius: 3,
    },
    progressCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressPercent: {
        fontSize: 24,
        fontWeight: '900',
    },
    progressBarBg: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressSubtext: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    emptyIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 13,
        marginTop: 4,
    },
    notifCard: {
        flexDirection: 'row',
        padding: 18,
        borderRadius: 18,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        borderWidth: 1.5,
        minHeight: 85,
    },
    notifIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    notifTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    notifTime: {
        fontSize: 12,
        fontWeight: '500',
    },
    notifMsg: {
        fontSize: 13,
        marginTop: 4,
        lineHeight: 19,
        fontWeight: '500',
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCardMain: {
        flex: 2,
        height: 120,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    actionCardContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    actionTextMain: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginTop: 8,
    },
    actionSubTextMain: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
    },
    actionCardSecondary: {
        flex: 1,
        height: 120,
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        gap: 8,
        borderWidth: 1.5,
    },
    actionTextSec: {
        fontSize: 14,
        fontWeight: '700',
    },
    heroButton: {
        width: '100%',
        height: 170,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    smallActionWrapper: {
        width: '32%',
    },
    smallActionBorder: {
        borderRadius: 24,
        padding: 1.5,
    },
    smallActionCard: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 18,
        borderRadius: 22.5,
        gap: 10,
        flex: 1,
        minHeight: 110,
        justifyContent: 'center',
    },
    smallActionLabel: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
        textAlign: 'center',
    },
    smallActionArrow: {
        position: 'absolute',
        right: 12,
        top: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    heroTextContainer: {
        flex: 1,
        zIndex: 2,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 16,
    },
    heroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    heroBtnText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    heroImage: {
        width: 140,
        height: 140,
        position: 'absolute',
        right: -20,
        bottom: -20,
        opacity: 0.2,
    },
    heroIconFallback: {
        position: 'absolute',
        right: 20,
        opacity: 0.2,
    },
    rowActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    smallActionCard: {
        flex: 1,
        padding: 18,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        borderWidth: 2,
        minHeight: 110,
    },
    smallActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    smallActionTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
        textAlign: 'center',
    },
    logoutBtn: {
        marginTop: 32,
        alignItems: 'center',
        padding: 16,
        marginBottom: 40,
    },
    logoutText: {
        color: '#FF3B30',
        fontWeight: '700',
        fontSize: 16,
    },
    shimmerContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },

    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    notifFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    miniChartPreview: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
        height: 30,
        marginTop: 12,
    },
    miniBar: {
        width: 6,
        borderRadius: 3,
    },
});
