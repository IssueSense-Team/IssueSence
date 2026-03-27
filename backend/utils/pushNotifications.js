import { Expo } from 'expo-server-sdk';
import PushToken from '../models/PushToken.js';

let expo = new Expo();

export const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        // Find all tokens for this user
        const tokens = await PushToken.find({ userId });

        if (!tokens || tokens.length === 0) {
            console.log(`No push tokens found for user ${userId}`);
            return;
        }

        let messages = [];
        for (let pushToken of tokens) {
            // Check that all your push tokens appear to be valid Expo push tokens
            if (!Expo.isExpoPushToken(pushToken.token)) {
                console.error(`Push token ${pushToken.token} is not a valid Expo push token`);
                continue;
            }

            // Construct a message
            messages.push({
                to: pushToken.token,
                sound: 'default',
                title: title,
                body: body,
                data: data,
            });
        }

        // The Expo push notification service accepts batches of tickets
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('Notification tickets:', ticketChunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending chunk:', error);
            }
        }

        // Handle receipts (optional - for checking if notifications were delivered)
        // This is usually done in a background task

        return tickets;
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
};

/**
 * Send notification to a specific role (e.g. all wardens)
 */
export const notifyRole = async (role, title, body, data = {}) => {
    try {
        // This requires joining with User model or having role in PushToken
        // For now, let's assume we find users with that role first
        const User = mongoose.model('User');
        const users = await User.find({ role });
        const userIds = users.map(u => u._id);

        const tokens = await PushToken.find({ userId: { $in: userIds } });

        if (tokens.length === 0) return;

        let messages = tokens.map(t => ({
            to: t.token,
            sound: 'default',
            title,
            body,
            data
        }));

        let chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }
    } catch (error) {
        console.error('Error in notifyRole:', error);
    }
};
