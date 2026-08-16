const mongoose = require('mongoose');

const MistakeSchema = new mongoose.Schema({
  sentence_id: { type: String, required: true },
  wrong_word: { type: String, required: true },
  count: { type: Number, default: 1 }
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lesson_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  completed_sentences: [{ type: String }], // Array of sentence_ids
  mistakes: [MistakeSchema],
  score: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure a user can only have ONE progress record per lesson
ProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
