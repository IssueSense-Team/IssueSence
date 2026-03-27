import React, { useEffect } from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface AnimatedInputProps extends TextInputProps {
    icon: keyof typeof Ionicons.glyphMap;
    isDark: boolean;
    focusedColor?: string;
}

export default function AnimatedInput({
    icon,
    isDark,
    focusedColor = '#6366F1',
    style,
    ...props
}: AnimatedInputProps) {
    const { colors } = useTheme();
    const isFocused = useSharedValue(0);

    const animatedContainerStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            isFocused.value,
            [0, 1],
            ['rgba(255,255,255,0.1)', focusedColor]
        );

        const backgroundColor = interpolateColor(
            isFocused.value,
            [0, 1],
            [
                isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255,255,255,0.7)',
                isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,0.95)'
            ]
        );

        return {
            borderColor,
            backgroundColor,
            transform: [
                { scale: withTiming(isFocused.value ? 1.02 : 1, { duration: 200 }) }
            ],
            shadowColor: focusedColor,
            shadowOffset: { width: 0, height: isFocused.value ? 4 : 0 },
            shadowOpacity: withTiming(isFocused.value ? 0.2 : 0, { duration: 200 }),
            shadowRadius: withTiming(isFocused.value ? 8 : 0, { duration: 200 }),
            elevation: withTiming(isFocused.value ? 4 : 0, { duration: 200 }),
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            isFocused.value,
            [0, 1],
            ['#94A3B8', focusedColor]
        );
        return { color };
    });

    return (
        <Animated.View style={[styles.container, animatedContainerStyle, style]}>
            <Animated.Text style={[animatedIconStyle, { marginRight: 12 }]}>
                <Ionicons name={icon} size={20} />
            </Animated.Text>
            <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                onFocus={(e) => {
                    isFocused.value = withTiming(1);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    isFocused.value = withTiming(0);
                    props.onBlur?.(e);
                }}
                {...props}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        borderRadius: 20,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        height: '100%',
    },
});
