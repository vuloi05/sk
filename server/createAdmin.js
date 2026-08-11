const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối DB để tạo Admin');

    const adminEmail = 'admin@dictaflow.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️ Tài khoản Admin đã tồn tại!');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);

      const newAdmin = new User({
        name: 'Quản trị viên',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });

      await newAdmin.save();
      console.log('🎉 Đã tạo tài khoản Admin thành công!');
      console.log('Email:', adminEmail);
      console.log('Mật khẩu:', '123456');
    }
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
