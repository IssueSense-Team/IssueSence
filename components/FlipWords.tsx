import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withDelay,
    withSequence,
} from 'react-native-reanimated';

interface FlipWordsProps {
    words: string[];
    duration?: number;
    style?: ViewStyle;
    wordStyle?: TextStyle;
    staticText?: string;
    staticColor?: string;
    colors?: string[]; // Optional array of colors for each word
}

const FlipWords: React.FC<FlipWordsProps> = ({
    words,
    duration = 3000,
    style,
    wordStyle,
    staticText,
    staticColor = '#000',
    colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B'],
}) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);

    const startAnimation = useCallback(() => {
        opacity.value = withSequence(
            withTiming(0, { duration: 400 }),
            withDelay(
                100,
                withTiming(1, { duration: 400 })
            )
        );
        translateY.value = withSequence(
            withTiming(10, { duration: 400 }),
            withDelay(
                100,
                withTiming(0, { duration: 400 })
            )
        );
    }, [opacity, translateY]);

    useEffect(() => {
        const interval = setInterval(() => {
            startAnimation();
            setTimeout(() => {
                setCurrentWordIndex((prev) => (prev + 1) % words.length);
            }, 500);
        }, duration);

        return () => clearInterval(interval);
    }, [words.length, duration, startAnimation]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    const getCurrentColor = () => {
        if (!colors || colors.length === 0) return '#000';
        return colors[currentWordIndex % colors.length];
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.contentWrapper}>
                <View style={styles.staticSection}>
                    {staticText && (
                        <Text numberOfLines={1} style={[wordStyle, { color: staticColor }]}>
                            {staticText}{' '}
                        </Text>
                    )}
                </View>
                <View style={styles.animatedSection}>
                    <Animated.View style={animatedStyle}>
                        <Text numberOfLines={1} style={[wordStyle, { color: getCurrentColor() }]}>
                            {words[currentWordIndex]}
                        </Text>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    staticSection: {
        flex: 1,
        alignItems: 'flex-end',
    },
    animatedSection: {
        flex: 1,
        alignItems: 'flex-start',
        overflow: 'hidden',
    },
});

export default FlipWords;
