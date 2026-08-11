const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  word: { type: String, required: true },
  meaning: { type: String, required: true },
  context: { type: String, required: true },
  next_review_date: { type: Date, required: true },
  ease_factor: { type: Number, default: 2.5 },
  interval: { type: Number, default: 1 } // Days until next review
}, { timestamps: true });

// 1 Word = 1 Card per user
FlashcardSchema.index({ user_id: 1, word: 1 }, { unique: true });
// Optimize query for daily reviews
FlashcardSchema.index({ user_id: 1, next_review_date: 1 });

module.exports = mongoose.model('Flashcard', FlashcardSchema);
