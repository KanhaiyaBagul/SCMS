const express = require('express');
const router = express.Router();
const Activity = require('../../models/Activity');
const adminAuth = require('../../middleware/adminAuth');

// Protect all routes in this file with the adminAuth middleware
router.use(adminAuth);

// GET /admin/activities - Fetch recent activities
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(10);
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err.message);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

module.exports = router;
