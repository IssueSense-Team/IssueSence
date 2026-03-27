import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /notifications - Fetch notifications for a user
router.get('/notifications', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50

        res.json(notifications);
    } catch (err) {
        console.error('Fetch notifications error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
