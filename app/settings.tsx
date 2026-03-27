import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AnimatedBackground from '../components/AnimatedBackground';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from './_layout';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Constants from 'expo-constants';

export default function SettingsScreen() {
    const { colors, isDark, setMode, mode } = useTheme();
    const { logout } = useAuth();
    const router = useRouter();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const toggleTheme = () => {
        const nextMode = mode === 'light' ? 'dark' : 'light';
        setMode(nextMode);
    };

    const SettingItem = ({
        icon,
        label,
        value,
        onPress,
        type = 'arrow',
        color
    }: {
        icon: string,
        label: string,
        value?: string,
        onPress?: () => void,
        type?: 'arrow' | 'switch' | 'none',
        color?: string
    }) => (
        <TouchableOpacity
            style={[styles.item, { borderColor: colors.borderMuted }]}
            onPress={type === 'switch' ? undefined : onPress}
            activeOpacity={type === 'switch' ? 1 : 0.7}
        >
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <View style={[styles.iconBox, { backgroundColor: (color || colors.primary) + '15' }]}>
                <Ionicons name={icon as any} size={22} color={color || colors.primary} />
            </View>
            <View style={styles.itemContent}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
                {value && <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{value}</Text>}
            </View>
            {type === 'arrow' && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
            {type === 'switch' && (
                <Switch
                    value={value === 'on'}
                    onValueChange={onPress}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={'#f4f3f4'}
                />
            )}
        </TouchableOpacity>
    );

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Screen options={{
                headerShown: true,
                title: 'Settings',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerShadowVisible: false
            }} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
                    <SettingItem
                        icon={isDark ? "moon" : "sunny"}
                        label="Dark Mode"
                        value={isDark ? 'on' : 'off'}
                        type="switch"
                        onPress={toggleTheme}
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
                    <SettingItem
                        icon="notifications"
                        label="Push Notifications"
                        value={notificationsEnabled ? 'on' : 'off'}
                        type="switch"
                        onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                    />
                    <SettingItem
                        icon="mail"
                        label="Email Alerts"
                        type="arrow"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
                    <SettingItem
                        icon="information-circle"
                        label="Version"
                        value={`${Constants.expoConfig?.version || '1.0.0'}`}
                        type="none"
                    />
                    <SettingItem
                        icon="document-text"
                        label="Terms of Service"
                        type="arrow"
                    />
                    <SettingItem
                        icon="shield-checkmark"
                        label="Privacy Policy"
                        type="arrow"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
                    <TouchableOpacity
                        style={[styles.logoutBtn, { borderColor: colors.dangerBackground }]}
                        onPress={() => {
                            logout();
                            router.replace('/login');
                        }}
                    >
                        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                        <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
                    </TouchableOpacity>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        IssueSence Modeled by DeepMind
                    </Text>
                </Animated.View>
            </ScrollView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 50 },
    sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 20, marginLeft: 4, letterSpacing: 1 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 22,
        marginBottom: 12,
        borderWidth: 2,
        overflow: 'hidden',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    itemContent: { flex: 1 },
    itemLabel: { fontSize: 16, fontWeight: '600' },
    itemValue: { fontSize: 13, marginTop: 2 },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64,
        borderRadius: 22,
        borderWidth: 2,
        marginTop: 10,
        gap: 12,
        overflow: 'hidden',
    },
    logoutText: { fontSize: 16, fontWeight: '700' },
    footerText: { textAlign: 'center', marginTop: 20, fontSize: 12 }
});
