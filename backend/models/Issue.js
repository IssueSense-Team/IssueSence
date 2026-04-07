import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  name: { type: String, required: true, trim: true },
  hostelNumber: { type: String, required: true, trim: true },
  roomNumber: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  photoBase64: { type: String, required: false },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  // Progress details
  progressSteps: [{
    stepDescription: { type: String, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  // Resolution details
  resolutionPhotoBase64: { type: String, required: false },
  resolutionRemark: { type: String, required: false },
  resolvedAt: { type: Date, required: false },
  resolvedBy: { type: String, required: false },
  isEscalated: { type: Boolean, default: false }
}, { timestamps: true });

const Issue = mongoose.model('Issue', IssueSchema);
export default Issue;

