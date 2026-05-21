/**
 * Smart Learning Planner - Core Scheduling Algorithm
 * Automatically prioritizes and distributes study tasks across available days
 */

/**
 * Calculate smart priority score for a task (0-100)
 * Higher score = higher priority
 */
const calculateSmartPriority = (task, userDailyHours = 4) => {
  let score = 0;
  const now = new Date();
  const daysUntilDeadline = Math.ceil((task.deadline - now) / (1000 * 60 * 60 * 24));
  const remainingHours = task.estimatedHours - task.completedHours;
  const daysNeeded = Math.ceil(remainingHours / (userDailyHours || 4));

  // 1. Deadline urgency (0-40 points)
  if (daysUntilDeadline <= 0) {
    score += 40; // Overdue
  } else if (daysUntilDeadline <= 1) {
    score += 38;
  } else if (daysUntilDeadline <= 3) {
    score += 30;
  } else if (daysUntilDeadline <= 7) {
    score += 20;
  } else if (daysUntilDeadline <= 14) {
    score += 10;
  } else {
    score += 5;
  }

  // 2. Days needed vs days available (0-30 points)
  if (daysNeeded >= daysUntilDeadline) {
    score += 30; // Critical: not enough time!
  } else if (daysNeeded >= daysUntilDeadline * 0.75) {
    score += 20;
  } else if (daysNeeded >= daysUntilDeadline * 0.5) {
    score += 15;
  } else {
    score += 5;
  }

  // 3. Manual priority weight (0-20 points)
  const priorityScores = { urgent: 20, high: 15, medium: 10, low: 5 };
  score += priorityScores[task.priority] || 10;

  // 4. Completion bonus (0-10 points)
  // Tasks closer to completion get a boost to finish them off
  const completionRatio = task.completedHours / task.estimatedHours;
  if (completionRatio >= 0.75) {
    score += 10;
  } else if (completionRatio >= 0.5) {
    score += 7;
  } else if (completionRatio > 0) {
    score += 3;
  }

  return Math.min(score, 100);
};

/**
 * Auto-schedule tasks across available days
 * Returns an array of { date, taskId, plannedHours }
 */
const autoScheduleTasks = (tasks, dailyStudyHours = 4, startDate = new Date()) => {
  const schedule = [];

  // Filter and sort active tasks by smart priority
  const activeTasks = tasks
    .filter(t => t.status !== 'completed' && t.completedHours < t.estimatedHours)
    .map(t => ({
      ...t,
      remainingHours: t.estimatedHours - t.completedHours,
      smartPriority: calculateSmartPriority(t, dailyStudyHours),
      daysUntilDeadline: Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.smartPriority - a.smartPriority);

  if (activeTasks.length === 0) return schedule;

  // Build a day-by-day schedule
  const maxDays = 30;
  const dailyAllocations = {};

  for (let day = 0; day < maxDays; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateKey = date.toISOString().split('T')[0];
    dailyAllocations[dateKey] = dailyStudyHours; // available hours each day
  }

  // Assign task hours to days
  for (const task of activeTasks) {
    let hoursLeft = task.remainingHours;
    const taskDeadline = new Date(task.deadline);

    for (let day = 0; day < maxDays && hoursLeft > 0; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);

      // Don't schedule past deadline
      if (date > taskDeadline) break;

      const dateKey = date.toISOString().split('T')[0];
      const availableHours = dailyAllocations[dateKey] || 0;

      if (availableHours <= 0) continue;

      const hoursToday = Math.min(hoursLeft, availableHours, 3); // max 3h per task per day
      if (hoursToday < 0.5) continue; // skip tiny slots

      schedule.push({
        taskId: task._id,
        date: new Date(date),
        plannedHours: hoursToday,
        taskTitle: task.title
      });

      dailyAllocations[dateKey] -= hoursToday;
      hoursLeft -= hoursToday;
    }
  }

  return schedule;
};

/**
 * Get tasks at risk (deadline too close, not enough time)
 */
const getAtRiskTasks = (tasks, dailyHours = 4) => {
  const now = new Date();
  return tasks
    .filter(t => t.status !== 'completed')
    .map(t => {
      const daysLeft = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
      const hoursLeft = t.estimatedHours - t.completedHours;
      const maxPossibleHours = daysLeft * dailyHours;
      return { ...t, daysLeft, hoursLeft, isAtRisk: hoursLeft > maxPossibleHours };
    })
    .filter(t => t.isAtRisk);
};

/**
 * Generate study plan summary text
 */
const generatePlanSummary = (tasks, dailyHours = 4) => {
  const active = tasks.filter(t => t.status !== 'completed');
  const totalHours = active.reduce((sum, t) => sum + (t.estimatedHours - t.completedHours), 0);
  const daysNeeded = Math.ceil(totalHours / dailyHours);
  const atRisk = getAtRiskTasks(tasks, dailyHours);

  return {
    totalActiveTasks: active.length,
    totalRemainingHours: totalHours,
    estimatedDaysToComplete: daysNeeded,
    atRiskTasks: atRisk.length,
    atRiskDetails: atRisk.map(t => ({
      title: t.title,
      daysLeft: t.daysLeft,
      hoursLeft: t.hoursLeft
    }))
  };
};

module.exports = {
  calculateSmartPriority,
  autoScheduleTasks,
  getAtRiskTasks,
  generatePlanSummary
};
