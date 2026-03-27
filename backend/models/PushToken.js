import mongoose from 'mongoose';

const PushTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    deviceId: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ['ios', 'android', 'web'],
        required: true
    }
}, {
    timestamps: true
});

// Index for fast lookups by userId
PushTokenSchema.index({ userId: 1 });
PushTokenSchema.index({ deviceId: 1 }, { unique: true });

const PushToken = mongoose.model('PushToken', PushTokenSchema);
export default PushToken;
