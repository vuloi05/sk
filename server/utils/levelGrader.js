const fs = require('fs');
const path = require('path');

// Đọc file Oxford 5000 vào bộ nhớ một lần duy nhất khi khởi động
const oxfordFilePath = path.join(__dirname, '../../client/public/oxford_5000_vi.json');
let oxfordData = [];
try {
  const fileContent = fs.readFileSync(oxfordFilePath, 'utf8');
  oxfordData = JSON.parse(fileContent);
} catch (error) {
  console.error('Không thể load file Oxford 5000:', error.message);
}

// Chuyển dữ liệu Oxford thành dạng Map (Từ vựng -> Trình độ) để tra cứu O(1)
const wordLevelMap = new Map();
oxfordData.forEach(item => {
  wordLevelMap.set(item.word.toLowerCase(), item.level.toUpperCase());
});

// Hàm loại bỏ dấu câu và tách từ
const extractWords = (text) => {
  const cleanText = text.toLowerCase().replace(/[^\w\s\']/g, ' ');
  return cleanText.split(/\s+/).filter(word => word.length > 0);
};

exports.calculateLessonLevel = (transcript) => {
  if (wordLevelMap.size === 0) return 'Unknown'; // Lỗi không có từ điển

  let totalWordsChecked = 0;
  let hardWordsCount = 0; // Từ vựng mức B2, C1

  // Các từ siêu thông dụng (Stop words) thường không nằm trong Oxford list để đánh giá
  const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from']);

  // Nối toàn bộ Text
  const fullText = transcript.map(s => s.en).join(' ');
  const words = extractWords(fullText);

  words.forEach(word => {
    if (stopWords.has(word)) return;
    
    // Nếu từ nằm trong Oxford
    const level = wordLevelMap.get(word);
    if (level) {
      totalWordsChecked++;
      if (level === 'B2' || level === 'C1') {
        hardWordsCount++;
      }
    }
  });

  if (totalWordsChecked === 0) return 'A2'; // Mặc định nếu quá ngắn

  const hardRatio = hardWordsCount / totalWordsChecked;

  // Thuật toán gán nhãn
  if (hardRatio > 0.15) {
    return 'C1'; // Hơn 15% là từ vựng khó -> Trình độ Cao cấp
  } else if (hardRatio > 0.08) {
    return 'B2'; 
  } else if (hardRatio > 0.04) {
    return 'B1';
  } else {
    return 'A2'; // Phổ thông
  }
};
