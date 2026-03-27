import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { sendOTPEmail } from '../utils/mailer.js';

const router = express.Router();

// Initialize Google OAuth client
// 
// TO SET YOUR CLIENT ID (RECOMMENDED):
// 1. Copy .env.example to .env in the myApp/backend folder
// 2. Add your Client ID: GOOGLE_CLIENT_ID=your_web_client_id_here
// 3. Restart your backend server
//
// ALTERNATIVE:
// Replace 'YOUR_GOOGLE_CLIENT_ID' below with your actual Client ID
//
// Get your Client ID from: https://console.cloud.google.com/apis/credentials
// Use the SAME Web application Client ID as the frontend
//
// Note: dotenv is already configured in index.js to load .env files
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, assignedHostel, roomNumber, phoneNumber, wardenSecretKey } = req.body;

    // Validation: Check for required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Email, password, and role are required'
      });
    }

    // Validation: Email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please enter a valid email address'
      });
    }

    // Validation: Password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password too short',
        details: 'Password must be at least 6 characters long'
      });
    }

    // Validation: Assigned Hostel (Required for both now)
    if (!assignedHostel) {
      return res.status(400).json({
        error: 'Missing hostel name',
        details: 'Assigned hostel is required'
      });
    }

    // Validation: Assigned Hostel for Warden
    if (role === 'warden' && !assignedHostel) {
      return res.status(400).json({
        error: 'Missing hostel assignment',
        details: 'Wardens must be assigned to a hostel'
      });
    }

    // Validation: Warden Secret Key
    if (role === 'warden' && wardenSecretKey !== '123') {
      return res.status(401).json({
        error: 'Invalid Warden Secret Key',
        details: 'The provided secret key is incorrect. You cannot register as a warden.'
      });
    }

    // Validation: Room Number for Student
    if (role === 'student' && !roomNumber) {
      return res.status(400).json({
        error: 'Missing room number',
        details: 'Students must provide a room number'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // Automatically resend OTP if unverified
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.otp = otp;
        existingUser.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await existingUser.save();
        sendOTPEmail(existingUser.email, otp).catch(e => console.error('Error resending OTP:', e));

        return res.status(409).json({
          error: 'Email not verified',
          details: 'An unverified account with this email exists. A new OTP has been sent.',
          requireOtp: true,
          email: existingUser.email
        });
      }
      return res.status(409).json({
        error: 'Email already exists',
        details: 'An account with this email already exists. Please login instead.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new user
    const user = new User({
      name: name?.trim() || '',
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      assignedHostel,
      roomNumber: role === 'student' ? roomNumber : undefined,
      phoneNumber: role === 'warden' ? phoneNumber : undefined,
      isVerified: false,
      otp: otp,
      otpExpires: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Save user to database
    await user.save();

    // Fire and forget email sending to avoid blocking the response
    sendOTPEmail(user.email, otp).catch(emailErr => {
      console.error('Error sending OTP email:', emailErr);
    });

    // Return success response indicating OTP is required
    res.status(201).json({
      message: 'Account created. Please check your email for the OTP.',
      requireOtp: true,
      email: user.email
    });
  } catch (err) {
    console.error('Signup error:', err);

    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.join(', ')
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Email already exists',
        details: 'An account with this email already exists'
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Server error',
      details: 'An error occurred while creating your account. Please try again.'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Check for required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        details: 'Email and password are required'
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Check if user signed up with Google (no password)
    if (!user.password) {
      return res.status(401).json({
        error: 'Google account',
        details: 'This account was created with Google. Please use Google sign-in instead.'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }



    // Return user data (don't send password)
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        assignedHostel: user.assignedHostel,
        roomNumber: user.roomNumber,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Server error',
      details: 'An error occurred during login. Please try again.'
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Missing fields', details: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Already verified', details: 'This account is already verified' });
    }

    console.log('--- OTP DEBUG ---');
    console.log('Passed OTP:', otp, 'Type:', typeof otp);
    console.log('User OTP:', user.otp, 'Type:', typeof user.otp);
    console.log('OTP Expires:', user.otpExpires);
    console.log('Current Date:', new Date());

    if (String(user.otp) !== String(otp) || user.otpExpires < new Date()) {
      return res.status(401).json({ error: 'Invalid OTP', details: 'The OTP is incorrect or has expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        assignedHostel: user.assignedHostel,
        roomNumber: user.roomNumber,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Server error', details: 'An error occurred during verification' });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing fields', details: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Already verified' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    sendOTPEmail(user.email, otp).catch(e => console.error('Error resending OTP:', e));

    res.json({ message: 'A new OTP has been sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth endpoint
router.post('/google', async (req, res) => {
  try {
    const { idToken, role, roomNumber, assignedHostel, phoneNumber, wardenSecretKey } = req.body;

    // Validation: Check for required fields
    if (!idToken) {
      return res.status(400).json({
        error: 'Missing token',
        details: 'Google ID token is required'
      });
    }

    // Validate role if provided (for signup)
    if (role && !['student', 'warden'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        details: 'Role must be either "student" or "warden"'
      });
    }

    // Validate Client ID is configured
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      console.error('Google Client ID not configured in backend');
      console.error('Please create a .env file in the backend folder with GOOGLE_CLIENT_ID');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Google authentication is not properly configured on the server. Please set GOOGLE_CLIENT_ID in the backend .env file.'
      });
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Google token verification error:', verifyError);
      const errorMessage = verifyError.message || 'Token verification failed';
      return res.status(401).json({
        error: 'Invalid token',
        details: `Google authentication failed: ${errorMessage}. Please try again.`
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        error: 'Email not provided',
        details: 'Google account email is required'
      });
    }

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase().trim() }
      ]
    });

    if (user) {
      // User exists - update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.name && name) {
          user.name = name;
        }
        await user.save();
      }

      // Return user data
      return res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          assignedHostel: user.assignedHostel,
          roomNumber: user.roomNumber,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt
        }
      });
    } else {
      // New user - create account
      // Role is required for new users
      if (!role) {
        return res.status(400).json({
          error: 'Role required',
          details: 'Please select a role (student or warden) for your account'
        });
      }

      // Validate required fields based on role
      if (!assignedHostel) {
        return res.status(400).json({
          error: 'Missing hostel',
          details: 'Hostel name is required'
        });
      }

      if (role === 'student' && !roomNumber) {
        return res.status(400).json({
          error: 'Missing room number',
          details: 'Room number is required for students'
        });
      }

      if (role === 'warden' && !phoneNumber) {
        return res.status(400).json({
          error: 'Missing phone number',
          details: 'Phone number is required for wardens'
        });
      }

      // Validation: Warden Secret Key for Google Signup
      if (role === 'warden' && wardenSecretKey !== '123') {
        return res.status(401).json({
          error: 'Invalid Warden Secret Key',
          details: 'The provided secret key is incorrect. You cannot register as a warden.'
        });
      }

      user = new User({
        googleId: googleId,
        email: email.toLowerCase().trim(),
        name: name || '',
        role: role,
        assignedHostel: assignedHostel,
        roomNumber: role === 'student' ? roomNumber : undefined,
        phoneNumber: role === 'warden' ? phoneNumber : undefined,
        isVerified: true // Google accounts start verified
        // No password required for Google OAuth users
      });

      await user.save();

      return res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          assignedHostel: user.assignedHostel,
          roomNumber: user.roomNumber,
          phoneNumber: user.phoneNumber
        }
      });
    }
  } catch (err) {
    console.error('Google OAuth error:', err);

    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.join(', ')
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Account already exists',
        details: 'An account with this email already exists'
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Server error',
      details: 'An error occurred during Google authentication. Please try again.'
    });
  }
});

// Update Profile Endpoint
router.post('/update-profile', async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Missing fields', details: 'User ID and Name are required' });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found', details: 'No user found with this ID' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        assignedHostel: user.assignedHostel,
        roomNumber: user.roomNumber
      }
    });

  } catch (err) {
    console.error('Update Profile error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get Warden Contact for a Hostel
router.get('/warden-contact/:hostelName', async (req, res) => {
  try {
    const { hostelName } = req.params;
    const warden = await User.findOne({
      role: 'warden',
      assignedHostel: new RegExp(`^${hostelName}$`, 'i')
    });

    if (!warden) {
      return res.status(404).json({ error: 'Warden not found', details: 'No warden found for this hostel' });
    }

    res.json({
      name: warden.name,
      phoneNumber: warden.phoneNumber
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
