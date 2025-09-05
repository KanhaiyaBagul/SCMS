const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const {
  sendUserConfirmationEmail,
  sendAdminNotification,
  sendUserUpdateEmail,
  sendAdminUpdateNotification,
} = require('../mailer');

// POST /complaints - Submit a new complaint
router.post('/', async (req, res) => {
  try {
    console.log('--- Complaint Submission ---');
    console.log('Session object:', JSON.stringify(req.session, null, 2));

    const { title, description, department, priority } = req.body;

    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const newComplaint = new Complaint({
      title,
      description,
      department,
      priority,
      user: user._id,
    });

    await newComplaint.save();

    // Await emails before sending response to ensure they are sent
    await sendUserConfirmationEmail(user.email, newComplaint);
    await sendAdminNotification(newComplaint);

    res.status(201).json({ message: 'Complaint submitted successfully.', complaint: newComplaint });

  } catch (err) {
    console.error('Error submitting complaint:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /complaints - Fetch all complaints
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .populate('user', 'email');
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err.message);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// PUT /complaints/:id - Update a complaint
router.put('/:id', async (req, res) => {
  try {
    const { title, description, department, priority } = req.body;
    const complaintId = req.params.id;

    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    // Populate user email for sending notifications
    const complaint = await Complaint.findById(complaintId).populate('user', 'email');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    if (complaint.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot edit this complaint.' });
    }

    // Update complaint fields
    complaint.title = title;
    complaint.description = description;
    complaint.department = department;
    complaint.priority = priority;

    await complaint.save();

    // Await emails before sending response to ensure they are sent
    await sendUserUpdateEmail(complaint.user.email, complaint);
    await sendAdminUpdateNotification(complaint);

    res.json({ message: 'Complaint updated successfully.', complaint });

  } catch (err) {
    console.error('Error updating complaint:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// DELETE /complaints/:id - Delete a complaint
router.delete('/:id', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.session?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    if (complaint.user.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete this complaint.' });
    }

    await complaint.deleteOne();

    res.json({ message: 'Complaint deleted successfully.' });
  } catch (err) {
    console.error('Error deleting complaint:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
