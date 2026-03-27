import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ModalScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 30, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="information-circle" size={80} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Ready to start?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Ensure your profile is complete and notifications are enabled to get the best experience from IssueSence.
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.btnWrapper}
          onPress={() => router.back()}
        >
          <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            <Text style={styles.btnText}>GET STARTED</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Link href="/" dismissTo style={styles.link}>
          <Text style={[styles.linkText, { color: colors.textSecondary }]}>Back to Home</Text>
        </Link>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  content: { alignItems: 'center', width: '100%' },
  iconBox: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 15, textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 17, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 26, fontWeight: '500' },
  btnWrapper: { width: '100%', borderRadius: 24, overflow: 'hidden', elevation: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  btn: { height: 65, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  link: { marginTop: 25 },
  linkText: { fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' }
});
