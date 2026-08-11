const Progress = require('../models/Progress');

// @desc    Cập nhật tiến độ học tập (Atomic Update + Upsert)
// @route   POST /api/progress/update
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { lesson_id, sentence_id, score_earned, mistake } = req.body;
    const user_id = req.user._id;

    // Khởi tạo các thao tác cập nhật cơ bản (Atomic operations)
    let updateOps = {
      $addToSet: { completed_sentences: sentence_id },
      $inc: { score: score_earned || 0 }
    };

    // Nếu người dùng gõ sai và gửi lên mistake
    // Logic đếm số lần sai sẽ được tối ưu ở mức nâng cao sau, tạm thời ta có thể push hoặc xử lý mảng
    if (mistake) {
      // Ví dụ: mistake = { sentence_id: 's1_abc', wrong_word: 'hungry' }
      updateOps.$push = { mistakes: mistake };
    }

    const progress = await Progress.findOneAndUpdate(
      { user_id, lesson_id },
      updateOps,
      { new: true, upsert: true } // Upsert: Tạo mới nếu chưa tồn tại
    );

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy tiến độ của học viên cho 1 bài học cụ thể
// @route   GET /api/progress/:lesson_id
// @access  Private
exports.getProgressByLesson = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user_id: req.user._id,
      lesson_id: req.params.lesson_id
    });

    if (progress) {
      res.json(progress);
    } else {
      // Trả về rỗng nếu chưa học bài này bao giờ
      res.json({ completed_sentences: [], score: 0, mistakes: [] });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
