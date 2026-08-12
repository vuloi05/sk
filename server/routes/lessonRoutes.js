const express = require('express');
const router = express.Router();
const { getLessons, getLessonById, createLesson, fetchYoutubeInfo, deleteLesson } = require('../controllers/lessonController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/youtube/fetch', protect, adminOnly, fetchYoutubeInfo);

router.route('/')
  .get(getLessons)
  .post(protect, adminOnly, createLesson);

router.route('/:id')
  .get(getLessonById)
  .delete(protect, adminOnly, deleteLesson);

module.exports = router;
