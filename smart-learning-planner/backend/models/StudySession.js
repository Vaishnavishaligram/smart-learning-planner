const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  plannedHours: {
    type: Number,
    required: true
  },
  actualHours: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: String,
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'poor'],
    default: 'good'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySession', studySessionSchema);
