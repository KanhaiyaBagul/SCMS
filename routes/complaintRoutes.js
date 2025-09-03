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

    // Send response first
    res.status(201).json({ message: 'Complaint submitted successfully.', complaint: newComplaint });

    // Send emails asynchronously
    sendUserConfirmationEmail(user.email, newComplaint)
      .catch(err => console.error('❌ Error sending user email:', err.message));

    sendAdminNotification(newComplaint)
      .catch(err => console.error('❌ Error sending admin email:', err.message));

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

    // Send response first
    res.json({ message: 'Complaint updated successfully.', complaint });

    // Send updated complaint emails asynchronously
    sendUserUpdateEmail(complaint.user.email, complaint)
      .catch(err => console.error('❌ Error sending user update email:', err.message));

    sendAdminUpdateNotification(complaint)
      .catch(err => console.error('❌ Error sending admin update email:', err.message));

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
