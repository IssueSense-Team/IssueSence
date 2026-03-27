import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Password required only if not using Google OAuth
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  role: {
    type: String,
    enum: {
      values: ['student', 'warden'],
      message: 'Role must be either student or warden'
    },
    required: [true, 'Role is required']
  },
  assignedHostel: {
    type: String,
    trim: true,
    required: [true, 'Hostel name is required']
  },
  roomNumber: {
    type: String,
    trim: true,
    required: function () {
      return this.role === 'student';
    }
  },
  phoneNumber: {
    type: String,
    trim: true,
    required: function () {
      return this.role === 'warden';
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Index for faster email lookups
UserSchema.index({ email: 1 });

const User = mongoose.model('User', UserSchema);
export default User;
