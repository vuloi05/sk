const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../../utils/mailer');

// Tạo JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dictaflow_super_secret', {
    expiresIn: '30d',
  });
};

// Tạo mã OTP ngẫu nhiên 6 số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Đăng ký user mới (Gửi OTP)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: 'Email đã tồn tại và đã được xác minh' });
      }
      // If user exists but not verified, we can resend OTP or update info
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    if (user) {
      // Update unverified user
      user.name = name;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false
      });
    }

    // Gửi email
    const previewUrl = await sendOTPEmail(email, otp);

    res.status(201).json({ 
      message: 'Mã OTP đã được gửi đến email của bạn', 
      email: user.email,
      previewUrl // Trả về previewUrl để dễ test trên máy (sau này bỏ)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xác minh mã OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Tài khoản đã được xác minh' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác' });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn, vui lòng yêu cầu gửi lại' });
    }

    // Xác minh thành công
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Gửi lại mã OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Tài khoản đã được xác minh, không cần OTP' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const previewUrl = await sendOTPEmail(email, otp);

    res.json({ message: 'Mã OTP mới đã được gửi', previewUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Chặn nếu chưa verify (trừ trường hợp Admin tự tạo, admin có isVerified default false, ta có thể cho pass)
      if (!user.isVerified && user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Tài khoản chưa được xác minh email. Vui lòng xác minh để tiếp tục.',
          needsVerification: true
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đăng nhập bằng Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    // For development/testing: We can bypass full verify if token is just the email (mock)
    // In production, use OAuth2Client from google-auth-library
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');
    
    let email, name, picture, sub;

    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        sub = payload.sub; // Google ID
      } else {
        // Fallback for dev mode when no client ID is present (Mock token contains email/name)
        const parsed = JSON.parse(atob(token.split('.')[1]));
        email = parsed.email;
        name = parsed.name || 'Người dùng Google';
        picture = parsed.picture || '';
        sub = parsed.sub || 'dummy-sub';
      }
    } catch (err) {
      return res.status(401).json({ message: 'Token Google không hợp lệ hoặc hết hạn.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Auto generate a complex random password for Google users
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword, // Store a dummy password
        avatar: picture,
        googleId: sub,
        isVerified: true, // Google already verified this email
      });
    } else {
      // Update existing user with google info if not present
      if (!user.googleId) user.googleId = sub;
      if (!user.avatar && picture) user.avatar = picture;
      user.isVerified = true; // Mark verified just in case
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Quên mật khẩu (Gửi OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const previewUrl = await sendOTPEmail(email, otp);
    res.json({ message: 'Mã OTP đặt lại mật khẩu đã được gửi', previewUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đặt lại mật khẩu
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Mã OTP không chính xác' });
    if (new Date() > user.otpExpires) return res.status(400).json({ message: 'Mã OTP đã hết hạn' });

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true; // Implicitly verify if they reset pass
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
