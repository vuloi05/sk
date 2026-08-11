const mongoose = require('mongoose');

const SentenceSchema = new mongoose.Schema({
  id: { type: String, required: true }, // e.g. "s1_abc123"
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  en: { type: String, required: true }, // original text
  vi: { type: String, default: '' } // translated text
}, { _id: false });

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['youtube', 'audio'], required: true },
  youtube_id: { type: String, default: null }, // Null if type is audio
  audio_url: { type: String, default: null },  // Null if type is youtube
  level: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Unknown'], default: 'Unknown' },
  thumbnail: { type: String, default: '' },
  transcript: [SentenceSchema],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', LessonSchema);
