import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../_layout';
import { useTheme } from '../../context/ThemeContext';
import AnimatedBackground from '../../components/AnimatedBackground';
import AnimatedInput from '../../components/AnimatedInput';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ReportScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [title, setTitle] = useState('');
    const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user?.roomNumber) {
            setRoomNumber(user.roomNumber);
        }
    }, [user]);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setImageBase64(result.assets[0].base64 || null);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Missing Details', 'Please fill in the issue title and description.');
            return;
        }

        setIsLoading(true);
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            // Backend ignores name/roomNumber from body and uses profile data.
            // We prepend the title to the description to ensure it's captured.
            const fullDescription = `[${title}] ${description}`;

            const payload = {
                description: fullDescription,
                userId: user?.id,
                photoBase64: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null
            };

            const response = await fetch(`${API_BASE_URL}/api/issues`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    'Success',
                    'Your issue has been reported successfully!',
                    [{ text: 'OK', onPress: () => router.push('/my-reports') }]
                );
            } else {
                throw new Error(data.details || data.error || data.message || 'Failed to submit report');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.header}
                    >
                        <Text style={[styles.title, { color: colors.text }]}>Report Issue</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Describe the problem at your hostel
                        </Text>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        style={styles.formContainer}
                    >
                        <BlurView
                            intensity={isDark ? 40 : 60}
                            tint={isDark ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.formContent}>
                            <AnimatedInput
                                icon="text"
                                placeholder="Issue Title (e.g., Broken Fan)"
                                value={title}
                                onChangeText={setTitle}
                                isDark={isDark}
                            />

                            <AnimatedInput
                                icon="business"
                                placeholder="Room Number"
                                value={roomNumber}
                                editable={false}
                                isDark={isDark}
                                style={{ opacity: 0.7 }}
                            />

                            <AnimatedInput
                                icon="document-text"
                                placeholder="Description"
                                value={description}
                                onChangeText={setDescription}
                                isDark={isDark}
                                multiline
                                numberOfLines={4}
                                style={{ height: 120, alignItems: 'flex-start', paddingTop: 12 }}
                            />

                            <TouchableOpacity
                                style={[styles.imagePicker, {
                                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)'
                                }]}
                                onPress={pickImage}
                            >
                                {image ? (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: image }} style={styles.imagePreview} />
                                        <View style={styles.changeImageOverlay}>
                                            <Ionicons name="camera" size={20} color="#fff" />
                                            <Text style={styles.changeImageText}>Change</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="image-outline" size={32} color={colors.primary} />
                                        <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                                            Attach a photo (Optional)
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitButton, { opacity: isLoading ? 0.7 : 1 }]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#4F46E5']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.submitText}>Submit Report</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.8,
    },
    formContainer: {
        borderRadius: 24,
        borderWidth: 1.5,
        overflow: 'hidden',
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 10,
    },
    formContent: {
        padding: 20,
    },
    imagePicker: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 20,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    imagePlaceholderText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    imagePreviewContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    changeImageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    changeImageText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    submitButton: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    submitGradient: {
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
