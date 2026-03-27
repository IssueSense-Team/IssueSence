import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// Blob Configuration for a "Mesh" feel
const BLOBS = [
    { id: 1, size: width * 1.6, initialX: -width * 0.4, initialY: -height * 0.1, duration: 25000 },
    { id: 2, size: width * 1.4, initialX: width * 0.2, initialY: height * 0.1, duration: 30000 },
    { id: 3, size: width * 1.5, initialX: -width * 0.2, initialY: height * 0.4, duration: 28000 },
    { id: 4, size: width * 1.3, initialX: width * 0.1, initialY: height * 0.7, duration: 35000 },
];

const AnimatedBlob = ({
    blob,
    colors,
}: {
    blob: typeof BLOBS[0];
    colors: [string, string, ...string[]];
}) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(Math.random() * 120 - 60, {
                duration: blob.duration,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        );
        translateY.value = withRepeat(
            withTiming(Math.random() * 120 - 60, {
                duration: blob.duration * 1.2,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        );
        scale.value = withRepeat(
            withTiming(1.3, {
                duration: blob.duration * 0.8,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.blob,
                {
                    width: blob.size,
                    height: blob.size,
                    left: blob.initialX,
                    top: blob.initialY,
                    borderRadius: blob.size / 2,
                },
                animatedStyle
            ]}
        >
            <LinearGradient
                colors={colors as [string, string, ...string[]]}
                style={styles.full}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        </Animated.View>
    );
};

export default function AnimatedBackground({ children }: { children?: React.ReactNode }) {
    const { isDark } = useTheme();

    const currentPalette = useMemo(() => isDark ? [
        ['rgba(99, 102, 241, 0.4)', 'rgba(99, 102, 241, 0)'],   // Indigo
        ['rgba(168, 85, 247, 0.35)', 'rgba(168, 85, 247, 0)'], // Purple
        ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0)'],   // Blue
        ['rgba(236, 72, 153, 0.25)', 'rgba(236, 72, 153, 0)'], // Pink
    ] : [
        ['rgba(129, 140, 248, 0.3)', 'rgba(129, 140, 248, 0)'], // Indigo pastel
        ['rgba(192, 132, 252, 0.25)', 'rgba(192, 132, 252, 0)'], // Purple pastel
        ['rgba(96, 165, 250, 0.3)', 'rgba(96, 165, 250, 0)'],   // Blue pastel
        ['rgba(110, 231, 183, 0.2)', 'rgba(110, 231, 183, 0)'], // Emerald pastel
    ], [isDark]);

    return (
        <View style={styles.container}>
            {/* Base Color Fill */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]} />

            {/* Mesh Blobs */}
            <View style={StyleSheet.absoluteFill}>
                {BLOBS.map((blob, index) => (
                    <AnimatedBlob
                        key={blob.id}
                        blob={blob}
                        colors={currentPalette[index % currentPalette.length]}
                    />
                ))}
            </View>

            {/* Blur Layer - iOS uses real blur, Android uses semi-transparent overlay */}
            {Platform.OS === 'ios' ? (
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
            ) : (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: isDark ? 'rgba(2,6,23,0.55)' : 'rgba(248,250,252,0.65)' }
                    ]}
                />
            )}

            {/* Static Gradient Overlay for Depth */}
            <LinearGradient
                colors={isDark ? ['rgba(2, 6, 23, 0.4)', 'transparent', 'rgba(2, 6, 23, 0.6)'] : ['rgba(255,255,255,0.2)', 'transparent', 'rgba(255,255,255,0.4)']}
                style={StyleSheet.absoluteFill}
            />

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    blob: {
        position: 'absolute',
        // We use blur if available in the env, but standard mesh relies on soft gradients
    },
    full: {
        flex: 1,
    },
});
