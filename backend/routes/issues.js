import express from 'express';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import Notification from '../models/Notification.js';
import { sendPushNotification } from '../utils/pushNotifications.js';

const router = express.Router();

// Create a new issue
router.post('/issues', async (req, res) => {
  const { description, photoBase64, userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'Auth failed', details: 'User ID is required' });
    }

    // Fetch user details from DB
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({ error: 'User not found', details: 'Could not find student profile' });
    }

    const { name, assignedHostel: hostelNumber, roomNumber } = student;

    if (!name || !hostelNumber || !roomNumber) {
      return res.status(400).json({
        error: 'Profile Incomplete',
        details: 'Please ensure your hostel and room number are set in your profile.'
      });
    }

    // 1. Strict Warden Check
    const wardens = await User.find({
      role: 'warden',
      assignedHostel: { $regex: new RegExp(`^${hostelNumber}$`, 'i') }
    });

    if (!wardens || wardens.length === 0) {
      return res.status(400).json({
        error: 'No Warden Found',
        details: `No warden assigned to ${hostelNumber}. Please contact admin.`
      });
    }

    // 2. Save the Issue
    const newIssue = new Issue({
      name,
      hostelNumber: hostelNumber.toUpperCase(),
      roomNumber,
      description: description || '',
      photoBase64: photoBase64 || undefined,
      userId,
      status: 'pending',
      createdAt: new Date()
    });

    const savedIssue = await newIssue.save();

    // 3. Send Email Notification to ALL Wardens
    const subject = `New Issue Report: ${hostelNumber} - Room ${roomNumber}`;
    const html = `
      <h2>New Issue Reported</h2>
      <p><strong>Student:</strong> ${name}</p>
      <p><strong>Hostel:</strong> ${hostelNumber}</p>
      <p><strong>Room:</strong> ${roomNumber}</p>
      <p><strong>Description:</strong> ${description || 'No description'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <br />
      <p>Please log in to the IssueSense app to resolve this issue.</p>
    `;

    // Notify each warden
    for (const warden of wardens) {
      // 1. Send Email
      if (warden.email) {
        await sendEmail(warden.email, subject, html);
      }

      // 2. Create App Notification (DB)
      try {
        await Notification.create({
          userId: warden._id,
          issueId: savedIssue._id,
          title: `New Issue: ${name}`,
          message: `Room ${roomNumber}: ${description ? description.substring(0, 30) + '...' : 'No description'}`,
          type: 'issue_assigned'
        });

        // 3. Send Push Notification
        await sendPushNotification(
          warden._id,
          `New Issue: ${name}`,
          `Room ${roomNumber}: ${description ? description.substring(0, 50) + '...' : 'New pending issue'}`
        );
      } catch (noteErr) {
        console.error('Failed to create notification for warden:', warden._id, noteErr);
      }
    }

    // 4. Set Timeout for Escalation (2 Days)
    setTimeout(async () => {
      try {
        const currentIssue = await Issue.findById(savedIssue._id);
        if (currentIssue && !currentIssue.isEscalated && currentIssue.status !== 'resolved') {
          // Send escalation email
          const headWardenEmail = '23cse320.jaganpanigrahi@giet.edu';
          const escalationSubject = `URGENT: Unresolved Issue - Hostel ${hostelNumber} Room ${roomNumber}`;
          const escalationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ffcccc; background-color: #fffaf0; border-radius: 8px;">
              <h2 style="color: #d9534f;">⚠️ URGENT: Issue Escalation</h2>
              <p>This is an automated notification. An issue was reported 2 days ago and has not yet been resolved by the assigned wardens.</p>
              <hr />
              <p><strong>Student:</strong> ${name}</p>
              <p><strong>Hostel:</strong> ${hostelNumber}</p>
              <p><strong>Room:</strong> ${roomNumber}</p>
              <p><strong>Description:</strong> ${description || 'No description'}</p>
              <p><strong>Reported At:</strong> ${savedIssue.createdAt.toLocaleString()}</p>
              <br />
              <p>Please review and take necessary action to resolve this issue.</p>
            </div>
          `;

          await sendEmail(headWardenEmail, escalationSubject, escalationHtml);

          // Mark as escalated
          currentIssue.isEscalated = true;
          await currentIssue.save();
          console.log(`Issue ${savedIssue._id} escalated to head warden.`);
        }
      } catch (escErr) {
        console.error('Error during escalation timeout:', escErr);
      }
    }, 2 * 24 * 60 * 60 * 1000); // 2 days in milliseconds

    res.status(201).json({
      message: 'Issue created successfully',
      issue: savedIssue
    });
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({
      error: 'Server error',
      details: 'An error occurred while creating the issue'
    });
  }
});

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const { hostel, userId, role } = req.query;

    let filter = {};
    if (role === 'warden' && hostel) {
      filter.hostelNumber = { $regex: new RegExp(`^${hostel}$`, 'i') };
    } else if (role === 'student' && userId) {
      // Show ONLY personal issues for students so it matches "My Reports"
      filter.userId = userId;
    }

    const total = await Issue.countDocuments(filter);
    const pending = await Issue.countDocuments({ ...filter, status: 'pending' });
    const resolved = await Issue.countDocuments({ ...filter, status: 'resolved' });
    const inProgress = await Issue.countDocuments({ ...filter, status: 'in_progress' });

    // Calculate Average Resolution Time
    const resolvedIssues = await Issue.find({ ...filter, status: 'resolved', resolvedAt: { $exists: true } });
    let avgResolutionTime = 0;
    if (resolvedIssues.length > 0) {
      const totalTime = resolvedIssues.reduce((acc, issue) => {
        const resolutionTime = new Date(issue.resolvedAt) - new Date(issue.createdAt);
        return acc + resolutionTime;
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedIssues.length / (1000 * 60 * 60)); // in hours
    }

    res.json({
      total,
      pending,
      resolved,
      inProgress,
      avgResolutionTime
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /:id/resolve - generic resolve via POST
router.post('/issues/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { photoBase64, remark, wardenId } = req.body;

    if (!photoBase64 || !remark) {
      return res.status(400).json({ error: 'Values missing', details: 'Photo and Remark are required to resolve.' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ error: 'Not found', details: 'Issue not found' });
    }

    issue.status = 'resolved';
    issue.resolutionPhotoBase64 = photoBase64;
    issue.resolutionRemark = remark;
    issue.resolvedAt = new Date();
    issue.resolvedBy = wardenId;

    await issue.save();

    // Remove notifications related to this issue so it clears from "Live Alerts"
    await Notification.deleteMany({ issueId: issue._id });

    // Notify student via App Notification
    if (issue.userId) {
      try {
        await Notification.create({
          userId: issue.userId,
          issueId: issue._id,
          title: `Issue Resolved: ${issue.name}`,
          message: `Warden has marked your issue as resolved. Tap to view proof.`,
          type: 'issue_resolved'
        });

        // Send Push Notification
        await sendPushNotification(
          issue.userId,
          `Issue Resolved: ${issue.name}`,
          `Your issue has been marked as resolved. Tap to view details and proof.`
        );
      } catch (nErr) {
        console.error('Failed to notify student:', nErr);
      }
    }

    res.json({ message: 'Issue resolved successfully', issue });

  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /issues/:id - Fetch single issue details
router.get('/issues/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Fetch issue error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /issues - List issues with filters
router.get('/issues', async (req, res) => {
  try {
    const { userId, hostel } = req.query;
    let filter = {};

    if (userId) filter.userId = userId;
    if (hostel) filter.hostelNumber = { $regex: new RegExp(`^${hostel}$`, 'i') };

    const issues = await Issue.find(filter).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    console.error('List issues error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
