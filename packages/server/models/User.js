const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for Google users
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  googleId: { type: String, default: null }, // Link to Google Account
  targetEnglishLevel: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', ''], default: '' },
  targetJapaneseLevel: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1', ''], default: '' },
  isUniversalVip: { type: Boolean, default: false },
  unlockedVipLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
