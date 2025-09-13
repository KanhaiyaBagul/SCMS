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
            return res.status(400).json({ msg: 'Department already exists' });
        }
        department = new Department({ name, manager });
        await department.save();
        res.json(department);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /admin/departments/:id - Update a department
router.put('/:id', async (req, res) => {
    const { name, manager } = req.body;
    const updatedDepartment = {};
    if (name) updatedDepartment.name = name;
    if (manager) updatedDepartment.manager = manager;

    try {
        let department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ msg: 'Department not found' });

        department = await Department.findByIdAndUpdate(req.params.id, { $set: updatedDepartment }, { new: true });
        res.json(department);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /admin/departments/:id - Delete a department
router.delete('/:id', async (req, res) => {
    try {
        let department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ msg: 'Department not found' });

        await Department.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Department removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
