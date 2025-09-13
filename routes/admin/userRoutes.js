const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const adminAuth = require('../../middleware/adminAuth');
const bcrypt = require("bcryptjs");

// Protect all routes in this file with the adminAuth middleware
router.use(adminAuth);

// GET /admin/users - Fetch all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /admin/users - Create a new user
router.post('/', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        user = new User({ username, email, password, role });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /admin/users/:id - Update a user
router.put('/:id', async (req, res) => {
    const { username, email, role } = req.body;
    const updatedUser = {};
    if (username) updatedUser.username = username;
    if (email) updatedUser.email = email;
    if (role) updatedUser.role = role;

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user = await User.findByIdAndUpdate(req.params.id, { $set: updatedUser }, { new: true });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /admin/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        await User.findByIdAndRemove(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
