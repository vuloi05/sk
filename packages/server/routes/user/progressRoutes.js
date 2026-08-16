const express = require('express');
const router = express.Router();
const { updateProgress, getProgressByLesson } = require('../../controllers/user/progressController');
const { protect } = require('../../middlewares/authMiddleware');

// Mọi API của Progress đều yêu cầu đăng nhập
router.use(protect);

router.post('/update', updateProgress);
router.get('/:lesson_id', getProgressByLesson);

module.exports = router;
