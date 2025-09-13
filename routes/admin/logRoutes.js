const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth');
const fs = require('fs');
const path = require('path');

// Protect all routes in this file with the adminAuth middleware
router.use(adminAuth);

// GET /admin/logs - Fetch server logs
router.get('/', (req, res) => {
    const logFilePath = path.join(__dirname, '../../server.log');
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading log file:', err);
            return res.status(500).json({ error: 'Failed to read log file' });
        }
        res.type('text/plain');
        res.send(data);
    });
});

module.exports = router;
