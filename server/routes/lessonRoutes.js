const express = require('express');
const router = express.Router();
const { getLessons, getLessonById, createLesson } = require('../controllers/lessonController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.route('/')
  .get(getLessons)
  .post(protect, adminOnly, createLesson);

router.route('/:id')
  .get(getLessonById);

module.exports = router;
