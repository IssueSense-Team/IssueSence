import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface SplashScreenProps {
    onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const { colors, isDark } = useTheme();

    // Core animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const taglineAnim = useRef(new Animated.Value(0)).current;
    const bgPulseAnim = useRef(new Animated.Value(0)).current;
    const textScalePulse = useRef(new Animated.Value(1)).current;

    // Letter animations for "Issue Sence"
    const letters = "Issue Sence".split("");
    const letterAnims = useRef(
        letters.map(() => new Animated.Value(0))
    ).current;

    // Floating particles (8 particles for premium feel)
    const particles = useRef(
        Array.from({ length: 8 }, () => ({
            translateY: new Animated.Value(0),
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.5),
        }))
    ).current;

    useEffect(() => {
        // Background pulse (continuous)
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgPulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(bgPulseAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Floating particles animation
        particles.forEach((particle, index) => {
            const delay = index * 150;
            const duration = 2000 + Math.random() * 1000;
            const distance = -80 - Math.random() * 40;

            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(particle.translateY, {
                            toValue: distance,
                            duration: duration,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.sequence([
                            Animated.timing(particle.opacity, {
                                toValue: 0.8,
                                duration: duration * 0.3,
                                useNativeDriver: true,
                            }),
                            Animated.timing(particle.opacity, {
                                toValue: 0,
                                duration: duration * 0.7,
                                useNativeDriver: true,
                            }),
                        ]),
                        Animated.sequence([
                            Animated.timing(particle.scale, {
                                toValue: 1.2,
                                duration: duration * 0.5,
                                useNativeDriver: true,
                            }),
                            Animated.timing(particle.scale, {
                                toValue: 0.5,
                                duration: duration * 0.5,
                                useNativeDriver: true,
                            }),
                        ]),
                    ]),
                    Animated.timing(particle.translateY, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });

        // Text scale pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(textScalePulse, {
                    toValue: 1.05,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(textScalePulse, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Main sequence
        Animated.sequence([
            // Phase 1: Container reveal with bounce
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),

            // Phase 2: Letter-by-letter reveal
            Animated.stagger(
                60,
                letterAnims.map((anim) =>
                    Animated.spring(anim, {
                        toValue: 1,
                        tension: 100,
                        friction: 10,
                        useNativeDriver: true,
                    })
                )
            ),

            Animated.delay(200),

            // Phase 3: Tagline reveal
            Animated.timing(taglineAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),

            Animated.delay(1200),

            // Phase 4: Elegant fade out
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(taglineAnim, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 500,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            onFinish();
        });
    }, []);

    const gradientColors = isDark
        ? ['#0F172A', '#1E293B', '#0F172A'] as const
        : ['#F8F9FE', '#E0E7FF', '#F8F9FE'] as const;

    const bgScale = bgPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View style={{ flex: 1, transform: [{ scale: bgScale }] }}>
                <LinearGradient
                    colors={gradientColors}
                    style={styles.gradient}
                >
                    {/* Floating Particles */}
                    <View style={styles.particlesContainer}>
                        {particles.map((particle, index) => {
                            const angle = (index / particles.length) * Math.PI * 2;
                            const radius = 120;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;

                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.particle,
                                        {
                                            left: width / 2 + x,
                                            top: height / 2 + y,
                                            opacity: particle.opacity,
                                            transform: [
                                                { translateY: particle.translateY },
                                                { scale: particle.scale },
                                            ],
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.particleDot,
                                            { backgroundColor: colors.primary },
                                        ]}
                                    />
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Main Content */}
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        {/* Brand Name with Letter Animation */}
                        <Animated.View
                            style={[
                                styles.brandContainer,
                                { transform: [{ scale: textScalePulse }] }
                            ]}
                        >
                            {letters.map((letter, index) => (
                                <Animated.Text
                                    key={index}
                                    style={[
                                        styles.brandLetter,
                                        {
                                            color: colors.text,
                                            opacity: letterAnims[index],
                                            transform: [
                                                {
                                                    translateY: letterAnims[index].interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [20, 0],
                                                    }),
                                                },
                                                {
                                                    scale: letterAnims[index].interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0.3, 1],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    {letter}
                                </Animated.Text>
                            ))}
                        </Animated.View>

                        {/* Tagline */}
                        <Animated.View
                            style={[
                                styles.taglineContainer,
                                {
                                    opacity: taglineAnim,
                                    transform: [
                                        {
                                            translateY: taglineAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [30, 0],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.tagline, { color: colors.textSecondary, textDecorationLine: 'underline' }]}>
                                    Smart
                                </Text>
                                <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                                    {' '}Campus Management
                                </Text>
                            </View>
                        </Animated.View>
                    </Animated.View>
                </LinearGradient>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
    },
    particleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 5,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        width: '100%',
    },
    brandLetter: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 2,
        textShadowColor: 'rgba(99, 102, 241, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },
    taglineContainer: {
        marginTop: 20,
        alignItems: 'center',
        paddingHorizontal: 20,
        width: '100%',
    },
    tagline: {
        fontSize: 13,
        letterSpacing: 3,
        textTransform: 'uppercase',
        fontWeight: '600',
        opacity: 0.8,
        textAlign: 'center',
    },
});
