<div align="center">
  <img src="https://raw.githubusercontent.com/vuloi05/sk/main/packages/user-app/public/vite.svg" alt="DictaFlow Logo" width="100"/>
  <h1>DictaFlow 🎧</h1>
  <p><strong>Nền tảng luyện nghe chép chính tả (Dictation) và học ngoại ngữ thông minh</strong></p>
  
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
**DictaFlow** là một ứng dụng web toàn diện giúp người học ngoại ngữ (đặc biệt là tiếng Nhật và tiếng Anh) cải thiện kỹ năng nghe hiểu thông qua phương pháp chép chính tả (Dictation). Hệ thống được thiết kế tối ưu với một kho bài học khổng lồ do Quản trị viên biên soạn, tích hợp công nghệ AI để hỗ trợ học tập, và bảo mật chặt chẽ.

Dự án hiện tại được tổ chức theo cấu trúc **Monorepo** nhằm chia tách rõ ràng quyền hạn giữa người dùng (User) và ban quản trị (Admin), tối ưu hiệu suất và bảo mật.

---

## 🏗 Cấu trúc dự án (Monorepo Workspace)

Dự án sử dụng tính năng **npm workspaces** để quản lý đa dự án trong một kho lưu trữ duy nhất:

- 📂 `packages/user-app`: (Cổng **3000**) Ứng dụng Frontend dành cho người dùng cuối (Học viên). Nơi học viên truy cập bài học, từ vựng, và luyện tập.
- 📂 `packages/admin-app`: (Cổng **3001**) Ứng dụng Frontend dành cho Quản trị viên (Admin). Chứa bảng điều khiển để tạo bài học, quản lý mã khóa VIP. Hoàn toàn cách ly với User App.
- 📂 `packages/server`: (Cổng **5000**) Backend API (Node.js/Express) xử lý logic nghiệp vụ và tương tác với cơ sở dữ liệu MongoDB.
- 📂 `packages/shared`: Module chứa các component UI, API service dùng chung cho cả Admin và User.
- 📂 `ai-server`: Backend phụ trợ bằng Python xử lý các tác vụ liên quan đến Trí tuệ nhân tạo (AI).

---

## ✨ Tính năng nổi bật (Key Features)

### 🇯🇵 Hỗ trợ tiếng Nhật & Tiếng Anh chuyên sâu
- **Tích hợp KANJIDIC2:** Phân tích trực tiếp chữ Kanji. Hiển thị Popup tra cứu ngay Âm On, Âm Kun, Âm Hán Việt.
- **Thống kê:** Theo dõi lộ trình và mục tiêu học tập (CEFR cho Tiếng Anh, JLPT cho Tiếng Nhật).
- **Hệ thống VIP Code:** Admin có thể tạo ra các mã truy cập độc quyền cho bài học chất lượng cao.

### 🎮 Đa dạng chế độ luyện tập
1. **Chép chính tả (Dictation):** Nghe và gõ lại toàn bộ câu. Hệ thống tự động soi lỗi chính tả chính xác từng ký tự.
2. **Điền từ (Gap-fill):** Nghe và điền vào các chỗ trống do hệ thống tạo ngẫu nhiên.
3. **Trắc nghiệm (MCQ):** Trả lời các câu hỏi đọc hiểu được biên soạn cùng bài nghe.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3, Vite.
- **Backend (Chính):** Node.js, Express, MongoDB (Mongoose), JWT Authentication.
- **Backend (AI):** Python.
- **Quản lý Package:** npm workspaces (`concurrently` để chạy nhiều app cùng lúc).

---

## 🚀 Hướng dẫn cài đặt (Local Setup)

1. **Clone repository:**
   ```bash
   git clone https://github.com/vuloi05/sk.git
   cd sk
   ```

2. **Cài đặt toàn bộ dependencies (tại thư mục gốc):**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (.env):**
   Bạn cần tạo 3 file `.env` ở các thư mục sau:
   
   **Frontend User (`packages/user-app/.env`)**
   ```env
   VITE_API_URL=http://localhost:5000/api/user
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

   **Frontend Admin (`packages/admin-app/.env`)**
   ```env
   VITE_API_URL=http://localhost:5000/api/admin
   ```
   
   **Backend (`packages/server/.env`)**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Biên dịch dữ liệu Kanji (nếu cần thiết cho lần đầu):**
   ```bash
   npm run parse-kanji --workspace=@dictaflow/server
   ```

5. **Chạy ứng dụng (Tất cả cổng cùng lúc):**
   ```bash
   npm run dev
   ```
   *Lệnh này sẽ tự động bật Server, User App (localhost:3000) và Admin App (localhost:3001) cùng lúc.*

---

<div align="center">
  <i>Được phát triển với niềm đam mê dành cho việc học ngôn ngữ. 🚀</i>
</div>
