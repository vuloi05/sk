# 🖥️ TÀI LIỆU KỸ THUẬT: KIẾN TRÚC FRONTEND
**Dự án:** DictaFlow - Nền tảng luyện nghe ngoại ngữ bằng phương pháp chép chính tả (Dictation)

---

## 1. TỔNG QUAN & Ý TƯỞNG CỐT LÕI (CORE CONCEPTS)

Frontend của DictaFlow không chỉ là một giao diện hiển thị thông thường, mà là một **Ứng dụng Đơn trang (Single Page Application - SPA)** mang trong mình một "Trình điều khiển âm thanh" (Dictation Engine) vô cùng phức tạp. 

**Ý tưởng thiết kế chủ đạo:**
- **Không vi phạm bản quyền (No-Piracy Architecture):** Thay vì vi phạm chính sách của YouTube bằng cách tải file video/audio (.mp4, .mp3) về lưu trữ trên máy chủ, Frontend sử dụng kỹ thuật "Nhúng và Điều khiển" (Embed & Control). Hệ thống chỉ nhúng khung phát hình (Iframe) của YouTube và dùng JavaScript can thiệp sâu vào đồng hồ thời gian (Playback Time) của video.
- **Trải nghiệm học tập liền mạch (Seamless Experience):** Các thao tác kiểm tra đáp án, chuyển câu, tải dữ liệu, và lưu điểm đều diễn ra "dưới ngầm" (Background API Calls), đảm bảo luồng suy nghĩ và thính giác của học viên không bao giờ bị gián đoạn.
- **Quản lý trạng thái siêu nhẹ (Lightweight State Management):** Xây dựng một thư viện Store tùy chỉnh dạng Observer Pattern thay cho Redux, giúp ứng dụng có dung lượng siêu nhỏ và hiệu năng tức thì.

---

## 2. CÔNG NGHỆ VÀ THƯ VIỆN SỬ DỤNG (TECH STACK)

Frontend được xây dựng bằng các công nghệ tối giản nhưng mạnh mẽ nhất hiện nay, hướng tới triết lý **Zero-Build-Bloat** (Không nhồi nhét thư viện rác).

1. **Preact & HTM (Hyperscript Tagged Markup):**
   - *Lý do chọn:* React.js tiêu chuẩn có dung lượng khá lớn và đòi hỏi Babel/Webpack phức tạp để biên dịch cú pháp JSX. DictaFlow chọn **Preact** (phiên bản thu nhỏ 3kB của React) kết hợp với **HTM**. HTM cho phép viết cấu trúc giao diện y hệt JSX nhưng ngay trong Template Strings của JavaScript thuần (`html`...``). Điều này giúp trình duyệt chạy thẳng code mà không cần bộ biên dịch nặng nề.
2. **Vite:**
   - *Lý do chọn:* Công cụ đóng gói (Bundler) và môi trường phát triển (Dev Server) thế hệ mới cực nhanh. Giúp HMR (Hot Module Replacement - tải lại giao diện không cần load trang) diễn ra trong phần nghìn giây.
3. **YouTube IFrame Player API:**
   - *Lý do chọn:* Đây là thư viện cốt lõi do chính Google cung cấp. Nó cho phép mã JavaScript từ ứng dụng gọi các lệnh như `playVideo()`, `pauseVideo()`, `seekTo(seconds)` trực tiếp vào luồng phát của YouTube.
4. **Axios:**
   - *Lý do chọn:* Xử lý HTTP Client để giao tiếp với Node.js Backend. Được sử dụng tính năng **Interceptors** để tự động đính kèm Token bảo mật (JWT) vào mọi yêu cầu truy xuất dữ liệu mà không cần phải viết lặp lại code ở từng hàm.

---

## 3. CẤU TRÚC MÃ NGUỒN (DIRECTORY STRUCTURE)

Dự án Frontend (nằm trong thư mục `src/`) được quy hoạch theo mô hình phân lớp (Layered Architecture):

- `main.js`: Trái tim của ứng dụng. Khởi tạo State, kiểm tra Xác thực, và vận hành hệ thống Điều hướng (Router) bằng lệnh `switch-case`.
- `core/`: 
  - `api.js`: Nơi đặt cấu hình Axios, quản lý JWT (LocalStorage) và định nghĩa các hàm gọi API (Login, Register, Fetch Lessons).
  - `audioManager.js`: Chứa mẫu thiết kế **Singleton** quản lý vòng đời của âm thanh (cả Audio HTML5 lẫn YouTube).
  - `store.js`: Hệ thống quản lý Trạng thái toàn cục (Observer Pattern).
- `components/`: Chứa các mảnh ghép giao diện độc lập (Login Modal, Header, Library Grid, Dictation Mode...).

---

## 4. CHI TIẾT CÁC THUẬT TOÁN & MODULE QUAN TRỌNG

### 4.1. Thuật toán Cắt Audio giả lập (Mock Audio Chopping)
Nằm trong `audioManager.js`. Vấn đề lớn nhất khi học chép chính tả là học viên chỉ muốn nghe 1 câu văn (Ví dụ từ giây thứ 10.5 đến giây 14.2), nhưng chúng ta lại không có file cắt rời.

**Giải pháp:**
1. Khi học viên chọn câu số 1, gọi lệnh `ytPlayer.seekTo(10.5)` và `playVideo()`.
2. Khởi tạo một vòng lặp siêu tốc (Polling Interval) cứ **100 mili-giây** chạy 1 lần.
3. Trong vòng lặp, liên tục hỏi YouTube: `getCurrentTime()`.
4. Nếu `currentTime >= 14.2`, lập tức kích hoạt hàm `pauseVideo()` và báo cho giao diện (UI) biết là đã đọc xong. 
-> Trải nghiệm người dùng giống hoàn toàn 100% việc nghe một file MP3 đã được cắt gọt sẵn bằng phần mềm.

### 4.2. Thuật toán So khớp chuỗi (String Matching & Diffing)
Nằm trong `DictationMode.js` và `scorer.js`. 
Khi người dùng gõ: *"I am a stu-dent,."* và đáp án gốc là *"I am a student!"*.
- **Bước 1 (Chuẩn hóa Text):** Code sẽ dùng Regex (`/[^\w\s]|_/g`) để dọn sạch sẽ toàn bộ dấu phẩy, chấm, gạch nối, viết hoa... của cả 2 chuỗi để đưa về dạng thuần túy (`i am a student`).
- **Bước 2 (Tokenization):** Cắt chuỗi thành mảng các từ (Words Array).
- **Bước 3 (Diffing):** So khớp từng vị trí trong mảng để phân loại từ thành 4 nhóm: 
  - 🟢 **Correct** (Khớp hoàn toàn).
  - 🔴 **Wrong** (Gõ sai từ vựng).
  - 🟡 **Missing** (Bỏ sót từ).
  - 🟣 **Extra** (Gõ thừa).
- **Bước 4 (Render):** Vẽ lại các thẻ HTML màu sắc tương ứng lên màn hình để học viên nhận ra mình sai ở đâu.

### 4.3. Kiến trúc Đồng bộ tiến độ ngầm (Background Sync)
Khi học viên bấm "Kiểm tra" một câu:
1. Giao diện ngay lập tức cập nhật điểm lên màn hình.
2. Cùng lúc đó, hàm `saveProgressAPI()` được gọi bất đồng bộ (`async/await`) ngầm dưới nền để ném dữ liệu (`lesson_id`, `sentence_id`, `score`) về máy chủ Node.js.
3. Người dùng tiếp tục chuyển sang câu tiếp theo học ngay lập tức, không hề có "Vòng xoay loading" nào chặn màn hình, đảm bảo tính liên tục của dòng chảy học tập (Flow).

> [!NOTE]
> Tính nghệ thuật của Frontend DictaFlow nằm ở khả năng tạo ra một cỗ máy xử lý thao tác người dùng liên tục với cường độ cao (Play/Pause Audio, So sánh chuỗi, Gọi API) mà bộ nhớ trình duyệt vẫn ở mức tối thiểu.
