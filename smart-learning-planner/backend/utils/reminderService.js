const nodemailer = require('nodemailer');
const Task = require('../models/Task');
const User = require('../models/User');

const sendDailyReminders = async () => {
  try {
    const users = await User.find({ 'preferences.reminderEnabled': true });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const user of users) {
      const urgentTasks = await Task.find({
        user: user._id,
        status: { $ne: 'completed' },
        deadline: { $gte: today, $lte: tomorrow }
      }).populate('subject', 'name');

      if (urgentTasks.length > 0 && user.email) {
        console.log(`Reminder: ${user.email} has ${urgentTasks.length} tasks due soon`);
        // Email sending would go here with configured SMTP
      }
    }
  } catch (err) {
    console.error('Reminder service error:', err);
  }
};

module.exports = { sendDailyReminders };
