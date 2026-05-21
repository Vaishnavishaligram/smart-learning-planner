const express = require('express');
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');
const { autoScheduleTask } = require('../utils/smartPlanner');

const router = express.Router();

// GET all tasks (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const { status, subject, priority, startDate, endDate, sort } = req.query;
    let query = { user: req.user._id };

    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.deadline = {};
      if (startDate) query.deadline.$gte = new Date(startDate);
      if (endDate) query.deadline.$lte = new Date(endDate);
    }

    let sortOption = { smartPriority: -1 };
    if (sort === 'deadline') sortOption = { deadline: 1 };
    else if (sort === 'created') sortOption = { createdAt: -1 };

    const tasks = await Task.find(query)
      .populate('subject', 'name color icon')
      .sort(sortOption);

    res.json({ success: true, tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
      .populate('subject', 'name color icon');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create task
router.post('/', protect, async (req, res) => {
  try {
    const taskData = { ...req.body, user: req.user._id };
    
    // Auto-schedule task across days
    const scheduledDates = autoScheduleTask(taskData);
    taskData.scheduledDates = scheduledDates;

    const task = await Task.create(taskData);
    await task.populate('subject', 'name color icon');

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subject', 'name color icon');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH update progress
router.patch('/:id/progress', protect, async (req, res) => {
  try {
    const { completedHours, status } = req.body;
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (completedHours !== undefined) task.completedHours = completedHours;
    if (status) task.status = status;

    // Update subject completed hours
    if (completedHours !== undefined) {
      await Subject.findByIdAndUpdate(task.subject, {
        $inc: { completedHours: completedHours - (task.completedHours || 0) }
      });
    }

    await task.save();
    await task.populate('subject', 'name color icon');
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
