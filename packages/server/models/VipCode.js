const mongoose = require('mongoose');

const VipCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  isUniversal: { type: Boolean, default: false }, // true = Mở toàn bộ VIP
  targetLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null }, // Nếu isUniversal = false
  maxUses: { type: Number, default: 0 }, // 0 = Không giới hạn
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('VipCode', VipCodeSchema);
