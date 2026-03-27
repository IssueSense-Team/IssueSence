import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    StatusBar,
    TextInput,
    Alert,
    Platform,
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useAuth } from './_layout';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';

const { width } = Dimensions.get('window');

export default function SupportCenter() {
    const { user } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [suggestion, setSuggestion] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [wardenContact, setWardenContact] = useState<{ name: string, phoneNumber: string } | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const sosPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
        ]).start();

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(sosPulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(sosPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        pulse.start();

        // Fetch Warden Contact
        if (user?.role === 'student' && user?.assignedHostel) {
            fetchWardenContact();
        }

        return () => pulse.stop();
    }, []);

    const fetchWardenContact = async () => {
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');
            const response = await fetch(`${API_BASE_URL}/api/auth/warden-contact/${user?.assignedHostel}`);
            if (response.ok) {
                const data = await response.json();
                setWardenContact(data);
            }
        } catch (error) {
            console.error('Error fetching warden contact:', error);
        }
    };

    const handleSOS = () => {
        if (user?.role === 'warden') {
            Alert.alert("SOS Hub", "This feature is for students to report emergencies.");
            return;
        }

        const message = wardenContact
            ? `Connect with Warden ${wardenContact.name} of ${user?.assignedHostel}?`
            : `Immediate help for Room ${user?.roomNumber || 'Not Set'}. Proceed with Warden Notification?`;

        Alert.alert(
            "EMERGENCY ALERT",
            message,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "CALL WARDEN",
                    style: "destructive",
                    onPress: () => {
                        if (wardenContact?.phoneNumber) {
                            Linking.openURL(`tel:${wardenContact.phoneNumber}`);
                        } else {
                            Alert.alert("Alert Sent", "The Warden has been notified via the system. Please stay in your room.");
                        }
                    }
                }
            ]
        );
    };

    const faqs = [
        { q: "How do I request a room change?", a: "Room change requests are processed twice a year. You can find the form under 'Official Documents' in the main office." },
        { q: "W-iFi is not working in my wing.", a: "Please report technical issues via the 'Report Issue' tab. Select 'IT & Network' as the category." },
        { q: "What are the mess timings?", a: "Breakfast: 7-9 AM | Lunch: 12-2 PM | Tea: 5-6 PM | Dinner: 8-10 PM." }
    ];

    return (
        <AnimatedBackground>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 2 }]}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Support Center</Text>
                </View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* SOS Section */}
                    <LinearGradient
                        colors={['#EF4444', '#B91C1C']}
                        style={styles.sosCard}
                    >
                        <View style={styles.sosInfo}>
                            <Text style={styles.sosTitle}>Emergency SOS</Text>
                            <Text style={styles.sosDesc}>Immediate help for security or medical emergencies.</Text>
                        </View>
                        <TouchableOpacity onPress={handleSOS}>
                            <Animated.View style={[styles.sosButton, { transform: [{ scale: sosPulse }] }]}>
                                <Ionicons name="megaphone" size={32} color="#EF4444" />
                                <Text style={styles.sosButtonText}>SOS</Text>
                            </Animated.View>
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Quick Contacts */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Essential Contacts</Text>
                    <View style={styles.contactsGrid}>
                        {[
                            { name: 'Warden Office', icon: 'business', phone: '011-234567' },
                            { name: 'University Security', icon: 'shield', phone: '100 or 999' },
                            { name: 'Health Center', icon: 'medkit', phone: '011-987654' },
                            { name: 'Mess Manager', icon: 'restaurant', phone: '011-555444' }
                        ].map((contact, idx) => (
                            <TouchableOpacity key={idx} style={[styles.contactItem, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 2 }]}>
                                <Ionicons name={contact.icon as any} size={20} color={colors.primary} />
                                <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                <Text style={[styles.contactPhone, { color: colors.primary }]}>{contact.phone}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* FAQ Section */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>How can we help?</Text>
                    {faqs.map((faq, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                            onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                                <Ionicons name={expandedFaq === idx ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                            </View>
                            {expandedFaq === idx && (
                                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Suggestion Box */}
                    <View style={[styles.suggestionBox, { backgroundColor: colors.primary + '10' }]}>
                        <Text style={[styles.suggestionTitle, { color: colors.primary }]}>Anonymous Suggestions</Text>
                        <Text style={[styles.suggestionDesc, { color: colors.textSecondary }]}>Have an idea to improve hostel life? Let us know.</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.borderMuted }]}
                            placeholder="Your suggestion..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={suggestion}
                            onChangeText={setSuggestion}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                if (!suggestion) return;
                                Alert.alert("Thank You", "Your feedback has been submitted anonymously.");
                                setSuggestion('');
                            }}
                        >
                            <Text style={styles.sendBtnText}>Submit Feedback</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '900', marginLeft: 15 },
    sosCard: { borderRadius: 30, padding: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    sosInfo: { flex: 1, marginRight: 15 },
    sosTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 5 },
    sosDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
    sosButton: { width: 85, height: 85, borderRadius: 43, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 5 },
    sosButtonText: { color: '#EF4444', fontSize: 14, fontWeight: '900', marginTop: 2 },
    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, marginTop: 10 },
    contactsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
    contactItem: { width: (width - 52) / 2, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    contactName: { fontSize: 14, fontWeight: '700', marginTop: 10, marginBottom: 4 },
    contactPhone: { fontSize: 13, fontWeight: '800' },
    faqCard: { padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(0,0,0,0.03)' },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 15 },
    faqAnswer: { fontSize: 14, marginTop: 12, lineHeight: 20 },
    suggestionBox: { padding: 25, borderRadius: 30, marginTop: 20 },
    suggestionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
    suggestionDesc: { fontSize: 13, marginBottom: 20 },
    input: { borderWidth: 2, borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', backgroundColor: 'rgba(255,255,255,0.5)' },
    sendBtn: { marginTop: 15, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
