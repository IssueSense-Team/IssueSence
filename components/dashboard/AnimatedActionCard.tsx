import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export const AnimatedActionCard = ({ children, onPress, style, gradient = false, colors: gradientColors, isDark }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const Wrapper = gradient ? LinearGradient : BlurView;
    const wrapperProps = gradient
        ? { colors: gradientColors, style: StyleSheet.absoluteFill }
        : {
            intensity: isDark ? 20 : 60,
            tint: isDark ? 'dark' : 'light',
            style: StyleSheet.absoluteFill
        };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => (scale.value = withSpring(0.96))}
            onPressOut={() => (scale.value = withSpring(1))}
            onPress={onPress}
            style={{ flex: 1 }}
        >
            <Animated.View style={[style, animatedStyle, { overflow: 'hidden' }]}>
                <Wrapper {...wrapperProps as any} />
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ... existing Action Grid styles ...
