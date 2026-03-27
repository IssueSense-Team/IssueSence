import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Animate numbers
const AnimatedText = Animated.createAnimatedComponent(Text);

export const StatCard = ({ icon, value, label, color, isDark, colors, index }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => (scale.value = withSpring(0.95))}
            onPressOut={() => (scale.value = withSpring(1))}
        >
            <Animated.View style={[animatedStyle]}>
                <BlurView
                    intensity={isDark ? 20 : 60}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                        styles.statCard,
                        {
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                            shadowColor: color,
                        }
                    ]}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon} size={24} color={color} />
                    </View>
                    <Text style={[styles.statValue, { color: isDark ? colors.text : color }]}>{value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
                </BlurView>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    statCard: {
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        width: 100, // Approximate width, flex handled in parent
        minHeight: 110,
        justifyContent: 'center'
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center'
    },
});
