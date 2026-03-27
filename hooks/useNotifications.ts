import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from 'axios';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface PushNotificationState {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: string | null;
}

export const useNotifications = (userId: string | undefined) => {
    const [state, setState] = useState<PushNotificationState>({
        expoPushToken: null,
        notification: null,
        error: null,
    });

    const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

    useEffect(() => {
        if (!userId) return;

        registerForPushNotificationsAsync()
            .then(token => {
                if (token) {
                    setState(prev => ({ ...prev, expoPushToken: token }));
                    sendTokenToBackend(userId, token);
                }
            })
            .catch(err => setState(prev => ({ ...prev, error: err.message })));

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setState(prev => ({ ...prev, notification }));
        });

        // This listener is fired whenever a user taps on or interacts with a notification 
        // (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response received:', response);
            // Navigation logic can be added here
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [userId]);

    const sendTokenToBackend = async (userId: string, token: string) => {
        try {
            const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ||
                (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

            await axios.post(`${API_BASE_URL}/api/push-tokens`, {
                userId,
                token,
                deviceId: Device.osBuildId || Device.modelName || 'unknown_device',
                platform: Platform.OS,
            });
            console.log('Push token sent to backend');
        } catch (error) {
            console.error('Error sending push token to backend:', error);
        }
    };

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'web') {
            return null;
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.warn('Failed to get push token for push notification!');
                return null;
            }

            try {
                const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
                    Constants.easConfig?.projectId;

                if (!projectId) {
                    console.warn('Push Notifications Error: No projectId found. Please add extra.eas.projectId to app.json.');
                    setState(prev => ({ ...prev, error: 'Missing projectId in app.json' }));
                    return null;
                }

                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })).data;
                console.log('Generated Expo Push Token:', token);
            } catch (error) {
                console.error('Error getting push token:', error);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    }

    return state;
};
