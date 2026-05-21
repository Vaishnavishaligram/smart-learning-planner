const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  estimatedHours: {
    type: Number,
    required: [true, 'Estimated hours are required'],
    min: [0.5, 'Minimum 0.5 hours']
  },
  completedHours: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Smart priority (auto-calculated)
  smartPriority: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  scheduledDates: [{
    date: Date,
    hours: Number,
    completed: { type: Boolean, default: false }
  }],
  tags: [String],
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Auto-calculate smart priority before save
taskSchema.pre('save', function(next) {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  const progress = this.estimatedHours > 0 ? this.completedHours / this.estimatedHours : 0;

  let score = 0;

  // Urgency score (0-40): closer deadline = higher score
  if (daysUntilDeadline <= 0) score += 40;
  else if (daysUntilDeadline <= 1) score += 35;
  else if (daysUntilDeadline <= 3) score += 25;
  else if (daysUntilDeadline <= 7) score += 15;
  else if (daysUntilDeadline <= 14) score += 8;
  else score += 2;

  // Manual priority score (0-30)
  const priorityScores = { urgent: 30, high: 20, medium: 10, low: 5 };
  score += priorityScores[this.priority] || 10;

  // Progress penalty (0-20): less progress = higher priority
  score += Math.round((1 - progress) * 20);

  // Effort score (0-10): more hours remaining = higher priority
  const hoursRemaining = this.estimatedHours - this.completedHours;
  if (hoursRemaining > 10) score += 10;
  else if (hoursRemaining > 5) score += 7;
  else if (hoursRemaining > 2) score += 4;
  else score += 1;

  this.smartPriority = Math.min(100, score);

  // Auto-update status
  if (daysUntilDeadline < 0 && this.status !== 'completed') {
    this.status = 'overdue';
  }

  next();
});

module.exports = mongoose.model('Task', taskSchema);
