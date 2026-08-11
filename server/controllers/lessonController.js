const Lesson = require('../models/Lesson');

// @desc    Lấy danh sách tất cả bài học
// @route   GET /api/lessons
// @access  Public
exports.getLessons = async (req, res) => {
  try {
    // Chỉ lấy các trường cần thiết để hiển thị Thư viện, không lấy mảng transcript nặng nề
    const lessons = await Lesson.find({}).select('title type thumbnail level createdAt');
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
    const lesson = await Lesson.findById(req.params.id);
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
    const { title, youtube_id, language, level, description, tags, thumbnail, transcript } = req.body;
    
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
      transcript: transcript || [],
      created_by: req.user._id // user is injected by authMiddleware
    });

    const createdLesson = await lesson.save();
    res.status(201).json(createdLesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
