const express = require('express');
const Subject = require('../models/Subject');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET all subjects
router.get('/', protect, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create subject
router.post('/', protect, async (req, res) => {
  try {
    const subject = await Subject.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update subject
router.put('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE subject
router.delete('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    await Task.deleteMany({ subject: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Subject and its tasks deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
