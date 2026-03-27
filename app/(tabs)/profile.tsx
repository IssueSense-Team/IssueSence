import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    StatusBar,
    Platform,
    Pressable,
} from 'react-native';
import { useAuth } from '../_layout';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBackground from '../../components/AnimatedBackground';
import Reanimated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    SlideInRight
} from 'react-native-reanimated';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const ActionCard = ({ icon, title, subtitle, onPress, color, colors, isDark }: any) => {
    return (
        <Reanimated.View entering={FadeInDown.delay(400).springify()}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                style={[styles.actionCard, { borderColor: colors.borderMuted }]}
            >
                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <View style={styles.actionText}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </Reanimated.View>
    );
};

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });

    useEffect(() => {
        fetchStats();
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
                    resolved: data.resolved || 0,
                    pending: data.pending || 0
                });
            }
        } catch (error) {
            console.log('Error fetching profile stats:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Ready to depart?",
            "You'll need to sign back in to manage your campus issues.",
            [
                { text: "Stay", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: logout }
            ]
        );
    };

    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'US';
    };

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Area */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                    <TouchableOpacity
                        style={[styles.profileOption, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}
                        onPress={() => router.push('/settings')}
                    >
                        <Ionicons name="options-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Glassmorphism Profile Card */}
                <Reanimated.View
                    entering={FadeInUp.duration(1000).springify()}
                    style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.borderMuted }]}
                >
                    <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

                    <View style={styles.profileTop}>
                        <LinearGradient
                            colors={['#6366F1', '#A855F7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarGradient}
                        >
                            <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
                        </LinearGradient>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'IssueSense User'}</Text>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role?.toUpperCase()}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.editCircle, { backgroundColor: colors.background }]}
                            onPress={() => router.push('/edit-profile')}
                        >
                            <Ionicons name="pencil" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Quick Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Issues</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.borderMuted }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.resolved}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.borderMuted }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: '#FF9500' }]}>{stats.pending}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                        </View>
                    </View>
                </Reanimated.View>

                {/* Account Details Detail Card */}
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>RESIDENCE INFO</Text>
                <Reanimated.View entering={FadeInDown.delay(200).springify()} style={[styles.detailsCard, { borderColor: colors.borderMuted }]}>
                    <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <View style={styles.infoRow}>
                        <View style={[styles.detailIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }]}>
                            <Ionicons name="business" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Assigned Hostel</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{user?.assignedHostel || 'Not Set'}</Text>
                        </View>
                        {user?.role === 'student' && (
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Room</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{user?.roomNumber || 'N/A'}</Text>
                            </View>
                        )}
                    </View>
                </Reanimated.View>

                {/* Quick Actions List */}
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>PREFERENCES</Text>
                <View style={styles.actionList}>
                    <ActionCard
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle="Alerts, sounds & updates"
                        color="#8B5CF6"
                        colors={colors}
                        isDark={isDark}
                        onPress={() => Alert.alert("Coming Soon")}
                    />
                    <ActionCard
                        icon="shield-checkmark-outline"
                        title="Privacy & Security"
                        subtitle="Password & auth settings"
                        color="#EC4899"
                        colors={colors}
                        isDark={isDark}
                        onPress={() => Alert.alert("Coming Soon")}
                    />
                    <ActionCard
                        icon="help-circle-outline"
                        title="Help & Support"
                        subtitle="FAQs and contact center"
                        color="#10B981"
                        colors={colors}
                        isDark={isDark}
                        onPress={() => router.push('/support-center')}
                    />
                </View>

                {/* Sign Out Section */}
                <Reanimated.View entering={FadeInDown.delay(600).springify()}>
                    <TouchableOpacity
                        style={[styles.signoutBtn, { borderColor: colors.danger + '40' }]}
                        onPress={handleLogout}
                    >
                        <LinearGradient
                            colors={[colors.danger + '10', 'transparent']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
                        <Text style={[styles.signoutText, { color: colors.danger }]}>Sign Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>IssueSense v2.0.4 • Crafted with ✨</Text>
                </Reanimated.View>
            </ScrollView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1,
    },
    profileOption: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    profileCard: {
        borderRadius: 32,
        padding: 24,
        marginBottom: 30,
        borderWidth: 1,
        overflow: 'hidden',
    },
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarGradient: {
        width: 80,
        height: 80,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
    },
    userInfo: {
        marginLeft: 20,
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 8,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    roleText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    editCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 24,
        opacity: 0.1,
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 16,
        marginLeft: 4,
        opacity: 0.8,
    },
    detailsCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        marginBottom: 30,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    detailIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    actionList: {
        gap: 12,
        marginBottom: 40,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 2,
        overflow: 'hidden',
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 13,
    },
    signoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        gap: 12,
        overflow: 'hidden',
    },
    signoutText: {
        fontSize: 17,
        fontWeight: '900',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 11,
        color: 'rgba(128,128,128,0.5)',
        fontWeight: '600',
    },
});
