import React, { useEffect, useRef } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    withRepeat,
    Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const Particle = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        // Random angle for explosion
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50;
        const targetX = Math.cos(angle) * distance;
        const targetY = Math.sin(angle) * distance;

        // Launch and explode
        opacity.value = withDelay(
            delay,
            withSequence(
                withTiming(1, { duration: 100 }),
                withDelay(1000, withTiming(0, { duration: 500 }))
            )
        );

        scale.value = withDelay(
            delay,
            withSequence(
                withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
                withTiming(0.5, { duration: 1000 })
            )
        );

        translateX.value = withDelay(
            delay,
            withTiming(targetX, { duration: 1200, easing: Easing.out(Easing.quad) })
        );

        translateY.value = withDelay(
            delay,
            withSequence(
                withTiming(targetY, { duration: 600, easing: Easing.out(Easing.quad) }),
                withTiming(targetY + 200, { duration: 600, easing: Easing.in(Easing.quad) })
            )
        );
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                { backgroundColor: color, left: startX },
                animatedStyle
            ]}
        />
    );
};

const Rocket = ({ color, startX, delay }: { color: string; startX: number; delay: number }) => {
    const particles = Array.from({ length: 15 }, (_, i) => i);

    return (
        <View style={[styles.rocketContainer, { left: startX }]}>
            {particles.map((i) => (
                <Particle key={i} delay={delay} color={color} startX={0} />
            ))}
        </View>
    );
};

interface FireworksProps {
    count?: number;
}

export default function Fireworks({ count = 5 }: FireworksProps) {
    const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#f72585', '#4cc9f0'];
    const rockets = Array.from({ length: count }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        startX: Math.random() * width,
        delay: i * 400,
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            {rockets.map((rocket) => (
                <Rocket
                    key={rocket.id}
                    color={rocket.color}
                    startX={rocket.startX}
                    delay={rocket.delay}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    rocketContainer: {
        position: 'absolute',
        bottom: 0,
        top: height * 0.3,
    },
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
    },
});
