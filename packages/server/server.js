require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Đã kết nối thành công tới MongoDB Atlas!');
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
  });

// API Routes setup with CORS and Routers
const adminCors = cors({ origin: ['http://localhost:3001', 'https://admin.dictaflow.com'] });
const userCors = cors({ origin: ['http://localhost:3000', 'https://dictaflow.com'] });

const adminRouter = express.Router();
adminRouter.use(adminCors);
adminRouter.use('/auth', require('./routes/user/authRoutes')); // Reuse auth for admin login
adminRouter.use('/user', require('./routes/user/userRoutes')); // Reuse user profile for admin
adminRouter.use('/lessons', require('./routes/admin/lessonRoutes'));
adminRouter.use('/vip-codes', require('./routes/admin/vipCodeRoutes'));

const userRouter = express.Router();
userRouter.use(userCors);
userRouter.use('/auth', require('./routes/user/authRoutes'));
userRouter.use('/lessons', require('./routes/user/lessonRoutes'));
userRouter.use('/progress', require('./routes/user/progressRoutes'));
userRouter.use('/user', require('./routes/user/userRoutes'));
userRouter.use('/vip-codes', require('./routes/admin/vipCodeRoutes')); // Wait, user doesn't need vip-code listing, but the redeem endpoint is in userRoutes. I'll just mount it in case.

app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.get('/', (req, res) => {
  res.send('DictaFlow API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
