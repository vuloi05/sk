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

// @desc    Tạo bài học mới (Tích hợp yt-dlp và Oxford Lexical Profiling)
// @route   POST /api/lessons
// @access  Private/Admin
exports.createLesson = async (req, res) => {
  try {
    const { youtube_url, audio_url, title, type, transcript } = req.body;
    
    let finalTitle = title;
    let finalYoutubeId = null;
    let finalThumbnail = '';
    let finalTranscript = transcript || [];
    let finalLevel = 'Unknown';

    if (type === 'youtube' && youtube_url) {
      // 1. Kéo dữ liệu bằng yt-dlp
      const ytData = await fetchYoutubeMetadataAndTranscript(youtube_url);
      finalTitle = title || ytData.title; // Ưu tiên title truyền vào, nếu không có thì lấy của YouTube
      finalYoutubeId = ytData.youtube_id;
      finalThumbnail = ytData.thumbnail;
      finalTranscript = ytData.transcript;
    }

    // 2. Chạy thuật toán Oxford để xếp hạng trình độ
    if (finalTranscript && finalTranscript.length > 0) {
      finalLevel = calculateLessonLevel(finalTranscript);
    }

    // 3. Lưu vào MongoDB
    const lesson = new Lesson({
      title: finalTitle || 'Untitle Lesson',
      type: type || 'youtube',
      youtube_id: finalYoutubeId,
      audio_url: audio_url || null,
      level: finalLevel,
      thumbnail: finalThumbnail,
      transcript: finalTranscript,
      created_by: req.user._id // user is injected by authMiddleware
    });

    const createdLesson = await lesson.save();
    res.status(201).json(createdLesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
