import express from 'express';
import PushToken from '../models/PushToken.js';

const router = express.Router();

// POST /api/push-tokens - Register or update a push token
router.post('/push-tokens', async (req, res) => {
    try {
        const { userId, token, deviceId, platform } = req.body;

        if (!userId || !token || !deviceId || !platform) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Upsert the token based on deviceId to avoid duplicates for the same device
        const pushToken = await PushToken.findOneAndUpdate(
            { deviceId },
            { userId, token, platform },
            { upsert: true, new: true }
        );

        res.json({ success: true, pushToken });
    } catch (err) {
        console.error('Error registering push token:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/push-tokens/:deviceId - Remove a token (e.g. on logout)
router.delete('/push-tokens/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        await PushToken.findOneAndDelete({ deviceId });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting push token:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
