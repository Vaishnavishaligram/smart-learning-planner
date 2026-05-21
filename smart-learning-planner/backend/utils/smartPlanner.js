const autoScheduleTask = (task) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const estimatedHours = parseFloat(task.estimatedHours);
  const maxHoursPerDay = 3;
  const scheduledDates = [];
  let remainingHours = estimatedHours;
  let currentDate = new Date(now);
  currentDate.setHours(9, 0, 0, 0);
  const daysAvailable = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
  const hoursPerDay = Math.min(maxHoursPerDay, Math.ceil(estimatedHours / daysAvailable));
  while (remainingHours > 0 && currentDate < deadline) {
    const todayHours = Math.min(hoursPerDay, remainingHours);
    scheduledDates.push({ date: new Date(currentDate), hours: Math.round(todayHours * 10) / 10, completed: false });
    remainingHours -= todayHours;
    currentDate.setDate(currentDate.getDate() + 1);
    if (scheduledDates.length > 30) break;
  }
  return scheduledDates;
};

const generateWeeklyPlan = (tasks, startDate, dailyGoalHours = 4) => {
  const plan = {};
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    const dateKey = day.toISOString().split('T')[0];
    plan[dateKey] = { date: new Date(day), tasks: [], totalHours: 0, goalHours: dailyGoalHours };
  }
  const sortedTasks = [...tasks].sort((a, b) => b.smartPriority - a.smartPriority);
  sortedTasks.forEach(task => {
    const remainingHours = task.estimatedHours - task.completedHours;
    if (remainingHours <= 0) return;
    const deadline = new Date(task.deadline);
    let hoursLeft = remainingHours;
    Object.keys(plan).forEach(dateKey => {
      const dayPlan = plan[dateKey];
      if (hoursLeft <= 0 || new Date(dateKey) >= deadline || dayPlan.totalHours >= dailyGoalHours) return;
      const availableHours = dailyGoalHours - dayPlan.totalHours;
      const assignedHours = Math.min(availableHours, hoursLeft, 3);
      if (assignedHours > 0) {
        dayPlan.tasks.push({ taskId: task._id, title: task.title, subject: task.subject, hours: Math.round(assignedHours * 10) / 10, priority: task.priority, smartPriority: task.smartPriority, deadline: task.deadline });
        dayPlan.totalHours += assignedHours;
        hoursLeft -= assignedHours;
      }
    });
  });
  return plan;
};

module.exports = { autoScheduleTask, generateWeeklyPlan };
