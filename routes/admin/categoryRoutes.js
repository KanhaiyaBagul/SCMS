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
            return res.status(400).json({ error: 'Category with that name already exists' });
        }
        category = new Category({ name });
        await category.save();
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (err) {
        console.error('Category creation error:', err.message);
        res.status(500).json({ error: 'Server error during category creation' });
    }
});

// PUT /admin/categories/:id - Update a category
router.put('/:id', async (req, res) => {
    const { name } = req.body;
    try {
        let category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        if (name) category.name = name;
        await category.save();

        res.json({ message: 'Category updated successfully', category });
    } catch (err) {
        console.error('Category update error:', err.message);
        res.status(500).json({ error: 'Server error during category update' });
    }
});

// DELETE /admin/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        await category.deleteOne();
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Category deletion error:', err.message);
        res.status(500).json({ error: 'Server error during category deletion' });
    }
});

module.exports = router;
