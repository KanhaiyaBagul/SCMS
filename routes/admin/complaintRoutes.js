const express = require('express');
const router = express.Router();
const Complaint = require('../../models/Complaint');
const adminAuth = require('../../middleware/adminAuth');

// Protect all routes in this file with the adminAuth middleware
router.use(adminAuth);

// GET /admin/complaints/stats - Fetch complaint statistics
router.get('/stats', async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: { $in: ['New', 'In Review'] } });
        const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
        const highPriorityComplaints = await Complaint.countDocuments({ priority: 'High' });

        const complaintsByCategory = await Complaint.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        const complaintsByStatus = await Complaint.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const resolutionTrends = await Complaint.aggregate([
            { $match: { status: 'Resolved' } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalComplaints,
            pendingComplaints,
            resolvedComplaints,
            highPriorityComplaints,
            complaintsByCategory,
            complaintsByStatus,
            resolutionTrends
        });
    } catch (err) {
        console.error('Error fetching complaint stats:', err.message);
        res.status(500).json({ error: 'Failed to fetch complaint stats' });
    }
});

// GET /admin/complaints/report - Generate a CSV report
router.get('/report', async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('user', 'username email')
            .populate('assignedTo', 'username email');

        let csv = 'Title,User,Department,Priority,Status,Assigned To,Created At\n';
        complaints.forEach(complaint => {
            csv += `${complaint.title},${complaint.user ? complaint.user.username : 'N/A'},${complaint.department},${complaint.priority},${complaint.status},${complaint.assignedTo ? complaint.assignedTo.username : 'Unassigned'},${complaint.createdAt}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('complaints-report.csv');
        res.send(csv);
    } catch (err) {
        console.error('Error generating report:', err.message);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// POST /admin/complaints/archive - Archive old complaints
router.post('/archive', async (req, res) => {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        await Complaint.updateMany(
            { createdAt: { $lt: oneYearAgo }, archived: false },
            { $set: { archived: true } }
        );

        res.json({ message: 'Old complaints archived successfully' });
    } catch (err) {
        console.error('Error archiving complaints:', err.message);
        res.status(500).json({ error: 'Failed to archive complaints' });
    }
});

// GET /admin/complaints - Fetch all complaints
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find({ archived: false }) // Exclude archived complaints
      .sort({ createdAt: -1 })
      .populate('user', 'username email')
      .populate('assignedTo', 'username email');
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err.message);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET /admin/complaints/:id - Fetch a single complaint
router.get('/:id', async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('user', 'username email')
            .populate('assignedTo', 'username email');
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        res.json(complaint);
    } catch (err) {
        console.error('Error fetching complaint:', err.message);
        res.status(500).json({ error: 'Failed to fetch complaint' });
    }
});

const User = require('../../models/User');
const Activity = require('../../models/Activity');
const { sendUserUpdateEmail, sendAssigneeNotification } = require('../../mailer');

// POST /admin/complaints/:id/notes - Add an internal note
router.post('/:id/notes', async (req, res) => {
    try {
        const { note } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        complaint.internalNotes.push({ note, author: req.user.id });
        await complaint.save();
        res.json(complaint);
    } catch (err) {
        console.error('Error adding note:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /admin/complaints/:id - Update a complaint
router.put('/:id', async (req, res) => {
    try {
        const { status, priority, assignedTo, publicResponse } = req.body;
        const complaint = await Complaint.findById(req.params.id).populate('user', 'email');

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        const oldStatus = complaint.status;
        const oldAssignedTo = complaint.assignedTo;

        complaint.status = status;
        complaint.priority = priority;
        complaint.assignedTo = assignedTo;
        complaint.publicResponse = publicResponse;

        await complaint.save();

        const activity = new Activity({ description: `Complaint "${complaint.title}" was updated.` });
        await activity.save();

        // Notify user if status changed
        if (oldStatus !== status && complaint.user) {
            sendUserUpdateEmail(complaint.user.email, complaint);
        }

        // Notify new assignee if changed
        if (assignedTo && oldAssignedTo?.toString() !== assignedTo) {
            const assignee = await User.findById(assignedTo);
            if (assignee) {
                sendAssigneeNotification(assignee.email, complaint);
            }
        }

        res.json({ message: 'Complaint updated successfully', complaint });
    } catch (err) {
        console.error('Error updating complaint:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
