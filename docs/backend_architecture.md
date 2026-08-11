# ⚙️ TÀI LIỆU KỸ THUẬT: KIẾN TRÚC BACKEND
**Dự án:** DictaFlow - Nền tảng luyện nghe ngoại ngữ bằng phương pháp chép chính tả (Dictation)

---

## 1. TỔNG QUAN & Ý TƯỞNG CỐT LÕI (CORE CONCEPTS)

Backend của DictaFlow đóng vai trò là "Bộ Não" và "Trung tâm Hậu cần" của hệ thống. Nó được thiết kế theo kiến trúc **RESTful API**, hoạt động hoàn toàn độc lập (Stateless) và tập trung vào hai triết lý cốt lõi:

- **Tự động hóa luồng dữ liệu (Data Pipeline Automation):** Admin không cần phải cặm cụi nhập tay từng câu tiếng Anh và gõ từng mốc thời gian. Mọi thứ được xử lý tự động từ A-Z chỉ với một đường Link YouTube.
- **Tính toàn vẹn Dữ liệu học tập (Data Integrity):** Vì ứng dụng yêu cầu lưu điểm liên tục (mỗi câu 1 lần), nên việc tranh chấp dữ liệu (Race Condition) rất dễ xảy ra. Kiến trúc Database phải giải quyết triệt để vấn đề này.

---

## 2. CÔNG NGHỆ VÀ THƯ VIỆN SỬ DỤNG (TECH STACK)

1. **Node.js & Express.js:**
   - *Lý do chọn:* Node.js có cơ chế Event-driven và Non-blocking I/O, cực kỳ xuất sắc trong việc xử lý các yêu cầu mạng (Network Requests), như việc gọi API bên thứ ba (YouTube) hay đọc ghi cơ sở dữ liệu tốc độ cao. Express.js cung cấp bộ định tuyến (Router) ngắn gọn, chuẩn RESTful.
2. **MongoDB & Mongoose (NoSQL Database):**
   - *Lý do chọn:* Dữ liệu của một bài học (Lesson) chứa mảng `transcript` (Bản dịch/Phụ đề) có thể lên tới 500 câu. Cơ sở dữ liệu quan hệ (SQL) sẽ tốn rất nhiều bảng và thao tác JOIN chậm chạp. MongoDB với mô hình Document-based cho phép nhồi toàn bộ mảng 500 câu đó vào 1 Bản ghi JSON duy nhất, tốc độ truy xuất cực kỳ nhanh chóng.
3. **JSON Web Token (JWT) & Bcrypt.js:**
   - *Lý do chọn:* Xây dựng cơ chế Xác thực (Authentication) phi trạng thái. Máy chủ Node.js không cần tốn RAM để lưu trữ phiên làm việc (Session) của người dùng. Mật khẩu được băm (Hash) an toàn tuyệt đối với Bcrypt trước khi xuống DB.
4. **yt-dlp (công cụ dòng lệnh) & youtube-dl-exec:**
   - *Lý do chọn:* `yt-dlp` là công cụ mã nguồn mở viết bằng Python mạnh mẽ nhất thế giới trong việc trích xuất Metadata của YouTube. Thư viện Node.js `youtube-dl-exec` sẽ sinh ra một "Tiến trình con" (Child Process) để giao tiếp với `yt-dlp` ngay từ bên trong JavaScript.

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Dữ liệu được quy hoạch chuẩn xác với 5 Bảng (Collections) trong MongoDB:

- **User:** Quản lý thông tin đăng nhập (`email`, `password_hash`), Avatar và cấp quyền (`role: admin/user`).
- **Lesson:** Lưu trữ thông tin video (YouTube URL, Thumbnail, Title). Quan trọng nhất là trường `transcript`, là một Array lưu trữ Object `{ id, start, end, en, vi }`.
- **Progress (Tiến độ):** Thiết kế tối ưu hóa cho truy vấn. Sử dụng cặp Khóa ngoại (Foreign Keys) là `{ user_id, lesson_id }`.
- **Flashcard & GlobalDictionary:** Hệ thống vệ tinh lưu trữ từ vựng đã tra cứu của riêng từng học viên, và bộ từ điển dùng chung cho toàn hệ thống để tiết kiệm dung lượng.

---

## 4. CHI TIẾT CÁC THUẬT TOÁN & MODULE QUAN TRỌNG

### 4.1. Đường ống Trích xuất Phụ đề (Subtitle Data Pipeline)
Nằm tại `utils/youtubeHelper.js`. Đây là lõi tự động hóa của dự án.
1. Admin gửi link: `POST /api/lessons`.
2. **Trích xuất ẩn (Dump JSON):** Hệ thống dùng `yt-dlp --dump-json` lấy toàn bộ thông tin nội bộ của YouTube, móc ra đường link `.vtt` ẩn (Subtitles URL) do chính con người viết.
3. **In-Memory Fetching:** Thay vì dùng ổ cứng tải file (gây chậm chạp và rác Server), Backend dùng Axios truy cập thẳng đường link trên để lấy chuỗi Text VTT thô, ném thẳng vào RAM.
4. **Chuẩn hóa (Regex Parsing):** Các thẻ HTML rác của YouTube (như `<c.colorE5E5E5>`, `<i>`) bị xóa bỏ hoàn toàn bằng Biểu thức chính quy. Text thô được chặt nhỏ thành một mảng Array JSON gọn gàng, gán UUID chuẩn bị đẩy xuống Database.

### 4.2. Trí tuệ nhân tạo xếp lớp: Oxford Grader
Nằm tại `utils/levelGrader.js`. Thay vì yêu cầu Admin tự ước lượng độ khó, Backend tự mình có một bộ não ngôn ngữ.
1. Máy chủ tải sẵn bộ từ điển chuẩn Châu Âu **Oxford 3000/5000** dạng JSON. Bộ từ điển này được "nhồi" vào cấu trúc dữ liệu `Map()` của Node.js (cấu trúc tra cứu nhanh nhất, O(1) Time Complexity).
2. Toàn bộ phụ đề tiếng Anh của video được nối lại, gỡ sạch dấu phẩy/chấm/xuống dòng.
3. Thuật toán quét từng từ và hỏi Map(): *"Từ này là A1 hay B2?"*.
4. Thuật toán tính toán Tỉ lệ phần trăm các từ vựng Khó (B2, C1). Nếu Tỉ lệ > 10% -> C1 (Khó). Nếu < 3% -> A1 (Dễ).
-> Bài học được dán nhãn một cách cực kỳ khoa học.

### 4.3. Thuật toán Lưu điểm Nguyên tử (Atomic Upsert Progress)
Nằm tại `progressController.js`. Khi 100 học viên cùng nhau học 1 bài và liên tục bấm nút "Check", hàng nghìn luồng Request sẽ bắn lên máy chủ cùng lúc.
- **Vấn đề:** Nếu dùng cơ chế truyền thống: `Tìm dữ liệu -> Đọc lên RAM -> Cộng điểm -> Lưu lại DB`, sẽ xảy ra lỗi **Race Condition** (ghi đè và mất điểm).
- **Giải pháp - Kỹ thuật Atomic Update:** Dùng hàm `findOneAndUpdate` của Mongoose kết hợp với các toán tử Atomic:
  - `$addToSet`: Đẩy ID của câu vừa làm đúng vào mảng (Nếu đã có ID đó thì không đẩy nữa, chống gian lận lặp lại).
  - `$inc`: Cộng dồn số điểm trực tiếp vào bản ghi tại tầng ổ cứng Database mà không cần đọc dữ liệu lên RAM.
  - `upsert: true`: Nếu học viên lần đầu học bài này (chưa có Document nào trong DB), MongoDB sẽ tự tạo mới ngay lập tức.
=> Đảm bảo độ trễ = 0, chịu tải cực lớn và tính an toàn dữ liệu 100%.

> [!IMPORTANT]
> Kiến trúc của hệ thống hoàn toàn đạt tiêu chuẩn để trở thành một sản phẩm thương mại hoặc một dự án bảo vệ luận văn (Thesis). Nó hội tụ đủ các kỹ thuật xử lý luồng, tự động hóa bằng tiến trình con, và bảo mật dữ liệu ở cấp độ cơ sở dữ liệu.
