const User = require('../../models/User');
const VipCode = require('../../models/VipCode');
const bcrypt = require('bcryptjs');

// @desc    Cập nhật thông tin hồ sơ
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const { name, avatar, targetEnglishLevel, targetJapaneseLevel, password } = req.body;

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (targetEnglishLevel !== undefined) user.targetEnglishLevel = targetEnglishLevel;
    if (targetJapaneseLevel !== undefined) user.targetJapaneseLevel = targetJapaneseLevel;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      targetEnglishLevel: user.targetEnglishLevel,
      targetJapaneseLevel: user.targetJapaneseLevel,
      token: req.headers.authorization.split(' ')[1] // return existing token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xác thực và dùng mã VIP
// @route   POST /api/user/redeem-code
// @access  Private
exports.redeemVipCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã code' });

    const vipCode = await VipCode.findOne({ code: code.toUpperCase() });
    if (!vipCode) {
      return res.status(404).json({ message: 'Mã code không tồn tại' });
    }

    // Check expiration
    if (vipCode.expiresAt && new Date() > new Date(vipCode.expiresAt)) {
      return res.status(400).json({ message: 'Mã code đã hết hạn' });
    }

    // Check max uses
    if (vipCode.maxUses > 0 && vipCode.usedCount >= vipCode.maxUses) {
      return res.status(400).json({ message: 'Mã code đã hết số lượt sử dụng' });
    }

    const user = await User.findById(req.user.id);
    
    // Check if user already has it
    if (vipCode.isUniversal && user.isUniversalVip) {
      return res.status(400).json({ message: 'Bạn đã có quyền truy cập toàn bộ VIP rồi' });
    }
    
    if (!vipCode.isUniversal && user.unlockedVipLessons.includes(vipCode.targetLesson)) {
      return res.status(400).json({ message: 'Bạn đã mở khóa bài học này rồi' });
    }

    // Update user
    if (vipCode.isUniversal) {
      user.isUniversalVip = true;
    } else {
      user.unlockedVipLessons.push(vipCode.targetLesson);
    }
    await user.save();

    // Increment code usage
    vipCode.usedCount += 1;
    await vipCode.save();

    res.json({
      message: 'Mở khóa thành công!',
      isUniversalVip: user.isUniversalVip,
      unlockedVipLessons: user.unlockedVipLessons
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
