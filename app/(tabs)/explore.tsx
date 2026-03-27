import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Reanimated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import AnimatedBackground from '../../components/AnimatedBackground';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
    const { colors, isDark } = useTheme();

    const ExploreCard = ({ title, description, icon, color, index }: { title: string, description: string, icon: any, color: string, index: number }) => (
        <Reanimated.View
            entering={FadeInDown.delay(200 + index * 100).springify()}
            layout={LinearTransition.springify()}
        >
            <TouchableOpacity
                activeOpacity={0.9}
            >
                <BlurView
                    intensity={isDark ? 20 : 60}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.glassCard, {
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'
                    }]}
                >
                    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon} size={28} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </BlurView>
            </TouchableOpacity>
        </Reanimated.View>
    );

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Reanimated.View entering={FadeInDown.springify()}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Learn how to use IssueSence efficiently</Text>

                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>QUICK GUIDES</Text>
                        <ExploreCard
                            title="Reporting an Issue"
                            description="Take a clear photo and describe the problem in detail for faster resolution."
                            icon="document-text-outline"
                            color="#6366F1"
                            index={0}
                        />
                        <ExploreCard
                            title="Tracking Status"
                            description="Check 'My Reports' to see real-time updates from hostel wardens."
                            icon="stats-chart-outline"
                            color="#10B981"
                            index={1}
                        />
                        <ExploreCard
                            title="Hostel Policies"
                            description="Understand the rules and regulations for maintenance and repairs."
                            icon="shield-checkmark-outline"
                            color="#F59E0B"
                            index={2}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>GET HELP</Text>
                        <ExploreCard
                            title="F.A.Q"
                            description="Find answers to common questions about the application."
                            icon="help-circle-outline"
                            color="#EC4899"
                            index={3}
                        />
                        <ExploreCard
                            title="Contact Support"
                            description="Reach out to our technical team for app-related issues."
                            icon="mail-outline"
                            color="#8B5CF6"
                            index={4}
                        />
                    </View>
                </Reanimated.View>
            </ScrollView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 100 },
    headerTitle: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    headerSubtitle: { fontSize: 16, fontWeight: '500', marginTop: 5, marginBottom: 40, opacity: 0.7 },
    section: { marginBottom: 35 },
    sectionHeader: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 20, marginLeft: 4, opacity: 0.6 },
    glassCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1.5,
        marginBottom: 15,
        overflow: 'hidden',
    },
    iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
    cardDesc: { fontSize: 14, fontWeight: '500', lineHeight: 20, opacity: 0.8 },
});
