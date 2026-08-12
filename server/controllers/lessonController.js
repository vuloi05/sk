const Lesson = require('../models/Lesson');

// @desc    Lấy danh sách tất cả bài học
// @route   GET /api/lessons
// @access  Public
exports.getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.aggregate([
      {
        $project: {
          title: 1,
          youtube_id: 1,
          language: 1,
          language: 1,
          level: 1,
          thumbnail: 1,
          duration: 1,
          views: 1,
          tags: 1,
          createdAt: 1,
          sentence_count: { $size: { $ifNull: ['$transcript', []] } }
        }
      }
    ]);
    // aggregate doesn't return Mongoose documents, so id is _id. We'll let frontend handle _id
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy chi tiết 1 bài học (bao gồm transcript)
// @route   GET /api/lessons/:id
// @access  Public
exports.getLessonById = async (req, res) => {
  try {
    // Tăng views lên 1 mỗi khi lấy chi tiết bài học
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } },
      { new: true } // Trả về document sau khi update
    );
    if (lesson) {
      res.json(lesson);
    } else {
      res.status(404).json({ message: 'Không tìm thấy bài học' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { fetchYoutubeMetadataAndTranscript } = require('../utils/youtubeHelper');
const { calculateLessonLevel } = require('../utils/levelGrader');

// @desc    Lấy thông tin và phụ đề từ YouTube
// @route   POST /api/lessons/youtube/fetch
// @access  Private/Admin
exports.fetchYoutubeInfo = async (req, res) => {
  try {
    const { youtube_url } = req.body;
    if (!youtube_url) {
      return res.status(400).json({ message: 'Vui lòng cung cấp link YouTube' });
    }
    const ytData = await fetchYoutubeMetadataAndTranscript(youtube_url);
    res.json(ytData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tạo bài học mới
// @route   POST /api/lessons
// @access  Private/Admin
exports.createLesson = async (req, res) => {
  try {
    const { title, youtube_id, language, level, description, tags, thumbnail, duration, transcript } = req.body;
    
    // Nếu là tiếng Anh và chưa có level, thử tính toán level
    let finalLevel = level || 'Unknown';
    if (language === 'en' && finalLevel === 'Unknown' && transcript && transcript.length > 0) {
      finalLevel = calculateLessonLevel(transcript);
    }

    // 3. Lưu vào MongoDB
    const lesson = new Lesson({
      title: title || 'Untitled Lesson',
      youtube_id: youtube_id,
      language: language || 'jp',
      level: finalLevel,
      description: description || '',
      tags: tags || [],
      thumbnail: thumbnail || '',
      duration: duration || 0,
      views: 0,
      transcript: transcript || [],
      created_by: req.user._id // user is injected by authMiddleware
    });

    const createdLesson = await lesson.save();
    res.status(201).json(createdLesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xóa bài học
// @route   DELETE /api/lessons/:id
// @access  Private/Admin
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học' });
    }
    
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa bài học thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
