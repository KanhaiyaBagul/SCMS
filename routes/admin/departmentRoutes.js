const express = require('express');
const router = express.Router();
const Department = require('../../models/Department');
const adminAuth = require('../../middleware/adminAuth');

// Protect all routes in this file with the adminAuth middleware
router.use(adminAuth);

// GET /admin/departments - Fetch all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().populate('manager', 'username email');
    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err.message);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /admin/departments - Create a new department
router.post('/', async (req, res) => {
    const { name, manager } = req.body;
    try {
        let department = await Department.findOne({ name });
        if (department) {
            return res.status(400).json({ error: 'Department with that name already exists' });
        }
        department = new Department({ name, manager });
        await department.save();
        res.status(201).json({ message: 'Department created successfully', department });
    } catch (err) {
        console.error('Department creation error:', err.message);
        res.status(500).json({ error: 'Server error during department creation' });
    }
});

// PUT /admin/departments/:id - Update a department
router.put('/:id', async (req, res) => {
    const { name, manager } = req.body;
    try {
        let department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ error: 'Department not found' });

        if (name) department.name = name;
        if (manager) department.manager = manager;
        await department.save();

        res.json({ message: 'Department updated successfully', department });
    } catch (err) {
        console.error('Department update error:', err.message);
        res.status(500).json({ error: 'Server error during department update' });
    }
});

// DELETE /admin/departments/:id - Delete a department
router.delete('/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ error: 'Department not found' });

        await department.deleteOne();
        res.json({ message: 'Department deleted successfully' });
    } catch (err) {
        console.error('Department deletion error:', err.message);
        res.status(500).json({ error: 'Server error during department deletion' });
    }
});

module.exports = router;
