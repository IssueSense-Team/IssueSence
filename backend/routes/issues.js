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

    // Calculate Average Resolution Time & Weekly breakdown
    const resolvedIssues = await Issue.find({ ...filter, status: 'resolved', resolvedAt: { $exists: true } });
    let avgResolutionTime = 0;
    
    const weeklyDataTemplate = [
        { label: 'Mon', solveCount: 0, avgTime: 0, fullLabel: 'Monday', totalTime: 0 },
        { label: 'Tue', solveCount: 0, avgTime: 0, fullLabel: 'Tuesday', totalTime: 0 },
        { label: 'Wed', solveCount: 0, avgTime: 0, fullLabel: 'Wednesday', totalTime: 0 },
        { label: 'Thu', solveCount: 0, avgTime: 0, fullLabel: 'Thursday', totalTime: 0 },
        { label: 'Fri', solveCount: 0, avgTime: 0, fullLabel: 'Friday', totalTime: 0 },
        { label: 'Sat', solveCount: 0, avgTime: 0, fullLabel: 'Saturday', totalTime: 0 },
        { label: 'Sun', solveCount: 0, avgTime: 0, fullLabel: 'Sunday', totalTime: 0 },
    ];

    if (resolvedIssues.length > 0) {
      const totalTime = resolvedIssues.reduce((acc, issue) => {
        const resolutionTimeHours = (new Date(issue.resolvedAt) - new Date(issue.createdAt)) / (1000 * 60 * 60);
        
        const dayIndex = new Date(issue.resolvedAt).getDay(); // Sunday = 0
        const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Map to Mon=0 ... Sun=6
        
        weeklyDataTemplate[mappedIndex].solveCount += 1;
        weeklyDataTemplate[mappedIndex].totalTime += resolutionTimeHours;
        
        return acc + resolutionTimeHours;
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedIssues.length); // in hours
    }

    const weeklyData = weeklyDataTemplate.map(day => ({
        label: day.label,
        solveCount: day.solveCount,
        avgTime: day.solveCount > 0 ? parseFloat((day.totalTime / day.solveCount).toFixed(1)) : 0,
        fullLabel: day.fullLabel
    }));

    res.json({
      total,
      pending,
      resolved,
      inProgress,
      avgResolutionTime,
      weeklyData
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

// POST /issues/:id/progress - update progress
router.post('/issues/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { stepDescription, completionPercentage, wardenId } = req.body;

    if (!stepDescription || completionPercentage === undefined) {
      return res.status(400).json({ error: 'Values missing', details: 'Step description and percentage are required.' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ error: 'Not found', details: 'Issue not found' });
    }

    // Add progress step
    issue.progressSteps.push({
      stepDescription,
      completedAt: new Date()
    });
    
    issue.completionPercentage = completionPercentage;
    
    if (issue.status === 'pending') {
      issue.status = 'in_progress';
    }

    await issue.save();

    // Notify student via App Notification
    if (issue.userId) {
      try {
        await Notification.create({
          userId: issue.userId,
          issueId: issue._id,
          title: `Progress Update: ${issue.name}`,
          message: `Your issue is now ${completionPercentage}% complete: ${stepDescription}`,
          type: 'issue_progress'
        });

        // Send Push Notification
        await sendPushNotification(
          issue.userId,
          `Progress Update: ${issue.name}`,
          `Your issue is now ${completionPercentage}% complete: ${stepDescription}`
        );
      } catch (nErr) {
        console.error('Failed to notify student:', nErr);
      }
    }

    res.json({ message: 'Progress updated successfully', issue });

  } catch (err) {
    console.error('Progress update error:', err);
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
