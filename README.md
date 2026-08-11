<div align="center">
  <img src="https://raw.githubusercontent.com/vuloi05/sk/main/public/vite.svg" alt="DictaFlow Logo" width="100"/>
  <h1>DictaFlow 🎧</h1>
  <p><strong>Nền tảng luyện nghe chép chính tả (Dictation) thông minh với sức mạnh của AI Gemini</strong></p>
  
  <p>
    <a href="https://github.com/vuloi05/sk/commits/main">
      <img src="https://img.shields.io/github/last-commit/vuloi05/sk?style=for-the-badge&color=0969da" alt="Last Commit">
    </a>
    <a href="https://github.com/vuloi05/sk/stargazers">
      <img src="https://img.shields.io/github/stars/vuloi05/sk?style=for-the-badge&color=2da44e" alt="Stars">
    </a>
  </p>
</div>

---

## 🌟 Giới thiệu (Overview)
**DictaFlow** là một ứng dụng web giúp người học ngoại ngữ (đặc biệt là tiếng Nhật và tiếng Anh) cải thiện kỹ năng nghe hiểu thông qua phương pháp chép chính tả (Dictation). Thay vì chỉ luyện tập thụ động, ứng dụng biến bất kỳ file audio hoặc video YouTube nào thành những bài học tương tác nhờ vào sức mạnh của **Google Gemini AI**.

Ứng dụng được thiết kế theo phong cách **Neobrutalism** (Tân thô mộc): Đường viền đậm, đổ bóng khối vuông vức (block shadows), và màu sắc tương phản cao, mang lại trải nghiệm UX/UI táo bạo và trẻ trung.

---

## ✨ Tính năng nổi bật (Key Features)

### 🤖 Tích hợp AI (Google Gemini)
- **Audio to Transcript:** Tự động nghe và bóc băng file Audio (MP3/WAV) hoặc Video YouTube ra văn bản.
- **Auto-generation:** Tự động sinh ra các bài tập Trắc nghiệm (MCQ) và Điền từ (Gap-fill) dựa trên nội dung transcript để người dùng luyện tập.

### 🇯🇵 Hỗ trợ tiếng Nhật chuyên sâu
- **Tích hợp KANJIDIC2:** Phân tích trực tiếp các chữ Kanji xuất hiện trong bài nghe.
- **Kanji Popup:** Nhấn vào bất kỳ chữ Kanji nào trong lúc kiểm tra đáp án để xem ngay Âm On, Âm Kun, Âm Hán Việt và nghĩa tiếng Anh.
- **Tự động phân loại JLPT:** AI đếm số lượng và phân bổ Kanji (N5-N1) để tự động đánh giá độ khó của bài học (Cơ bản, Trung cấp, Nâng cao).
- **Thống kê Kanji:** Theo dõi tổng số lượng Kanji bạn đã học qua tất cả các bài tập.

### 🎮 Đa dạng chế độ luyện tập
1. **Chép chính tả (Dictation):** Nghe và gõ lại toàn bộ câu. Hệ thống tự động so sánh, tìm lỗi sai (dư từ, thiếu từ, sai chính tả).
2. **Điền từ (Gap-fill):** Nghe và điền vào các chỗ trống do AI tạo ra.
3. **Trắc nghiệm (MCQ):** Trả lời các câu hỏi đọc hiểu về nội dung vừa nghe.

### 🌍 Thư viện bài học
- Được lưu trữ bởi **MongoDB**, người dùng có thể luyện tập các bài nghe từ thư viện chung.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Design System).
- **Build Tool:** Vite (Dev Server & Bundling).
- **Backend/Database:** Node.js, Express, MongoDB (Mongoose).
- **AI Engine:** Google Gemini Pro API.
- **Data:** KANJIDIC2 (JSON compiled).

---

## 🚀 Hướng dẫn cài đặt (Local Setup)

1. **Clone repository:**
   ```bash
   git clone https://github.com/vuloi05/sk.git
   cd sk
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường:**
   Tạo file `.env` ở thư mục `server/` và `.env` ở thư mục gốc:
   
   **Frontend (`.env`)**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   
   **Backend (`server/.env`)**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. **Biên dịch Kanji data (nếu cần):**
   ```bash
   npm run parse-kanji
   ```
   *(Scripts tự động parse file XML KANJIDIC2 thành `public/kanji.json` nhẹ nhàng cho frontend).*

5. **Chạy ứng dụng (Dev Mode):**
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại `http://localhost:3000`.

---

## 🎨 Kiến trúc UI (Neobrutalism)
Giao diện được xây dựng từ con số 0 mà không cần dùng framework CSS nặng nề nào. Mọi token thiết kế đều nằm gọn trong `src/styles/index.css`:
- `var(--radius-md)`: Bo góc viền.
- `var(--shadow-brutal)`: Đổ bóng vuông (Offset X, Offset Y không mờ).
- `var(--border-bold)`: Viền đen dày táo bạo.

---

<div align="center">
  <i>Được phát triển với niềm đam mê dành cho việc học ngôn ngữ. 🚀</i>
</div>
