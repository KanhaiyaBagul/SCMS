const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const adminAuth = require('../../middleware/adminAuth');

// Protect all routes in this file with the adminAuth middleware
router.use(adminAuth);

// GET /admin/categories - Fetch all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /admin/categories - Create a new category
router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        let category = await Category.findOne({ name });
        if (category) {
            return res.status(400).json({ msg: 'Category already exists' });
        }
        category = new Category({ name });
        await category.save();
        res.json(category);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /admin/categories/:id - Update a category
router.put('/:id', async (req, res) => {
    const { name } = req.body;
    const updatedCategory = {};
    if (name) updatedCategory.name = name;

    try {
        let category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Category not found' });

        category = await Category.findByIdAndUpdate(req.params.id, { $set: updatedCategory }, { new: true });
        res.json(category);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /admin/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Category not found' });

        await Category.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Category removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
