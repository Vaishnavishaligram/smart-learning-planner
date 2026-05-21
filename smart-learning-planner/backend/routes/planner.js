const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { generateWeeklyPlan } = require('../utils/smartPlanner');

const router = express.Router();

// GET weekly planner view
router.get('/weekly', protect, async (req, res) => {
  try {
    const { startDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const tasks = await Task.find({
      user: req.user._id,
      status: { $ne: 'completed' },
      deadline: { $gte: start, $lte: end }
    }).populate('subject', 'name color icon').sort({ smartPriority: -1 });

    const weeklyPlan = generateWeeklyPlan(tasks, start, req.user.preferences?.dailyGoalHours || 4);
    res.json({ success: true, weeklyPlan, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET today's schedule
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Task.find({
      user: req.user._id,
      status: { $ne: 'completed' },
      'scheduledDates.date': { $gte: today, $lt: tomorrow }
    }).populate('subject', 'name color icon').sort({ smartPriority: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET calendar data
router.get('/calendar', protect, async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const tasks = await Task.find({
      user: req.user._id,
      deadline: { $gte: startDate, $lte: endDate }
    }).populate('subject', 'name color icon');

    // Format for calendar
    const calendarEvents = tasks.map(task => ({
      id: task._id,
      title: task.title,
      date: task.deadline,
      status: task.status,
      priority: task.priority,
      smartPriority: task.smartPriority,
      color: task.subject?.color,
      subject: task.subject?.name
    }));

    res.json({ success: true, events: calendarEvents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
