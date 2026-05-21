const express = require('express');
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalTasks, completedTasks, overdueTasks, urgentTasks, subjects] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({ user: userId, status: 'overdue' }),
      Task.countDocuments({ user: userId, priority: 'urgent', status: { $ne: 'completed' } }),
      Subject.find({ user: userId })
    ]);

    // Tasks due this week
    const dueThisWeek = await Task.countDocuments({
      user: userId,
      status: { $nin: ['completed'] },
      deadline: { $gte: today, $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) }
    });

    // Weekly completion data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const completed = await Task.countDocuments({
        user: userId,
        status: 'completed',
        updatedAt: { $gte: day, $lt: nextDay }
      });

      weeklyData.push({
        date: day.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()],
        completed
      });
    }

    // Subject-wise progress
    const subjectProgress = await Promise.all(subjects.map(async (subject) => {
      const subjectTasks = await Task.find({ user: userId, subject: subject._id });
      const total = subjectTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
      const completed = subjectTasks.reduce((sum, t) => sum + t.completedHours, 0);
      return {
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        total: Math.round(total * 10) / 10,
        completed: Math.round(completed * 10) / 10,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }));

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        urgentTasks,
        dueThisWeek,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        weeklyData,
        subjectProgress
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
