import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export const NotificationCard = ({ notif, index, isDark, colors, onPress }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handlePressIn = () => { scale.value = withSpring(0.97); };
    const handlePressOut = () => { scale.value = withSpring(1); };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={{ marginBottom: 12 }}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
            >
                <Animated.View style={[animatedStyle]}>
                    <BlurView
                        intensity={isDark ? 20 : 60}
                        tint={isDark ? 'dark' : 'light'}
                        style={[
                            styles.notifCard,
                            !notif.isRead && { borderLeftColor: colors.primary, borderLeftWidth: 4 },
                            {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.5)'
                            }
                        ]}
                    >
                        <View style={[styles.notifIcon, { backgroundColor: notif.isRead ? (isDark ? '#1e293b' : '#E5F1FF') : (isDark ? '#052e16' : '#E5FFE9') }]}>
                            <Ionicons
                                name={notif.isRead ? "notifications-outline" : "checkmark-circle"}
                                size={24}
                                color={notif.isRead ? colors.primary : "#10B981"}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={[styles.notifTitle, { color: colors.text }]}>{notif.title}</Text>
                                {!notif.isRead && (
                                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />
                                )}
                            </View>
                            <Text style={[styles.notifTime, { color: colors.textSecondary, marginBottom: 6 }]}>
                                {new Date(notif.createdAt).toLocaleDateString()}
                            </Text>
                            <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>
                                {notif.message}
                            </Text>
                        </View>
                    </BlurView>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    notifCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
    notifIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    notifTime: {
        fontSize: 12,
    },
    notifMsg: {
        fontSize: 13,
        lineHeight: 18,
    },
    unreadBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 6,
    },
});
