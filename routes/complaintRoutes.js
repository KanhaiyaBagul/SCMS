const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const {
  sendUserConfirmationEmail,
  sendAdminNotification,
  sendUserUpdateEmail,
  sendAdminUpdateNotification,
} = require('../mailer');

// POST /complaints - Submit a new complaint
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, department, priority } = req.body;
    const userId = req.user.id;

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

    const activity = new Activity({ description: `New complaint "${newComplaint.title}" was submitted by ${user.username}.` });
    await activity.save();

    res.status(201).json({ message: 'Complaint submitted successfully.', complaint: newComplaint });

    sendUserConfirmationEmail(user.email, newComplaint)
      .catch(err => console.error('❌ Error sending user email:', err.message));
    sendAdminNotification(newComplaint)
      .catch(err => console.error('❌ Error sending admin email:', err.message));

  } catch (err) {
    console.error('Error submitting complaint:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /complaints - Fetch all complaints for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'email');
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err.message);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// PUT /complaints/:id - Update a complaint
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, department, priority } = req.body;
    const complaintId = req.params.id;
    const userId = req.user.id;

    const complaint = await Complaint.findById(complaintId).populate('user', 'email');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    if (complaint.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot edit this complaint.' });
    }

    complaint.title = title;
    complaint.description = description;
    complaint.department = department;
    complaint.priority = priority;

    await complaint.save();
    res.json({ message: 'Complaint updated successfully.', complaint });

    sendUserUpdateEmail(complaint.user.email, complaint)
      .catch(err => console.error('❌ Error sending user update email:', err.message));
    sendAdminUpdateNotification(complaint)
      .catch(err => console.error('❌ Error sending admin update email:', err.message));

  } catch (err) {
    console.error('Error updating complaint:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /complaints/:id - Delete a complaint
router.delete('/:id', auth, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user.id;

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
