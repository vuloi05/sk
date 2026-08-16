const VipCode = require('../../models/VipCode');
const Lesson = require('../../models/Lesson');

// @desc    Lấy danh sách tất cả mã VIP
// @route   GET /api/vip-codes
// @access  Private/Admin
exports.getVipCodes = async (req, res) => {
  try {
    const codes = await VipCode.find().populate('targetLesson', 'title');
    res.json(codes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tạo mã VIP mới
// @route   POST /api/vip-codes
// @access  Private/Admin
exports.createVipCode = async (req, res) => {
  try {
    const { code, isUniversal, targetLesson, maxUses, expiresAt } = req.body;

    // Check if code already exists
    const existingCode = await VipCode.findOne({ code });
    if (existingCode) {
      return res.status(400).json({ message: 'Mã code này đã tồn tại' });
    }

    const vipCode = new VipCode({
      code: code.toUpperCase(),
      isUniversal: isUniversal || false,
      targetLesson: isUniversal ? null : targetLesson,
      maxUses: maxUses || 0,
      expiresAt: expiresAt || null
    });

    const savedCode = await vipCode.save();
    
    // Trả về kèm thông tin targetLesson nếu có để frontend hiển thị
    const populatedCode = await VipCode.findById(savedCode._id).populate('targetLesson', 'title');
    res.status(201).json(populatedCode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xóa mã VIP
// @route   DELETE /api/vip-codes/:id
// @access  Private/Admin
exports.deleteVipCode = async (req, res) => {
  try {
    const vipCode = await VipCode.findById(req.params.id);
    if (!vipCode) {
      return res.status(404).json({ message: 'Không tìm thấy mã VIP' });
    }

    await VipCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa mã VIP thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
