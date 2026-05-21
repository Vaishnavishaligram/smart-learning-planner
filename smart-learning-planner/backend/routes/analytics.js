const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.id;

    const [tasks, subjects, sessions] = await Promise.all([
      Task.find({ user: userId }),
      Subject.find({ user: userId, isActive: true }),
      StudySession.find({ user: userId })
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

    const totalStudyHours = sessions.reduce((sum, s) => sum + (s.actualHours || 0), 0);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // This week sessions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = sessions.filter(s => new Date(s.date) >= weekAgo);
    const weekHours = weekSessions.reduce((sum, s) => sum + (s.actualHours || 0), 0);

    // Per-subject breakdown
    const subjectBreakdown = await Promise.all(
      subjects.map(async (subj) => {
        const subjTasks = tasks.filter(t => t.subject.toString() === subj._id.toString());
        const subjCompleted = subjTasks.filter(t => t.status === 'completed').length;
        const subjSessions = sessions.filter(s => s.subject.toString() === subj._id.toString());
        const subjHours = subjSessions.reduce((sum, s) => sum + (s.actualHours || 0), 0);

        return {
          subject: { id: subj._id, name: subj.name, color: subj.color, icon: subj.icon },
          totalTasks: subjTasks.length,
          completedTasks: subjCompleted,
          studyHours: Math.round(subjHours * 10) / 10,
          progress: subj.progress
        };
      })
    );

    // Daily study hours for last 14 days
    const dailyData = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.date).toISOString().split('T')[0];
        return sessionDate === dateStr;
      });
      const dayHours = daySessions.reduce((sum, s) => sum + (s.actualHours || 0), 0);
      dailyData.push({
        date: dateStr,
        label: date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
        hours: Math.round(dayHours * 10) / 10,
        sessions: daySessions.length
      });
    }

    res.json({
      success: true,
      overview: {
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        pendingTasks: totalTasks - completedTasks - overdueTasks - inProgressTasks,
        completionRate,
        totalStudyHours: Math.round(totalStudyHours * 10) / 10,
        weekHours: Math.round(weekHours * 10) / 10,
        totalSubjects: subjects.length
      },
      subjectBreakdown,
      dailyData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/analytics/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = await StudySession.find({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    }).populate('task', 'title').populate('subject', 'name color');

    const todayHours = todaySessions.reduce((sum, s) => sum + (s.actualHours || 0), 0);

    // Tasks due today or overdue
    const urgentTasks = await Task.find({
      user: req.user.id,
      status: { $in: ['pending', 'in-progress', 'overdue'] },
      deadline: { $lte: tomorrow }
    }).populate('subject', 'name color icon').sort('deadline');

    res.json({
      success: true,
      todayHours: Math.round(todayHours * 10) / 10,
      todaySessions,
      urgentTasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
