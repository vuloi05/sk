# Tổng hợp Lệnh NPM sử dụng trong dự án DictaFlow

Dự án DictaFlow được chia thành 2 phần tách biệt: **Frontend** (giao diện web sử dụng Vite/Vanilla JS) và **Backend** (máy chủ xử lý API sử dụng Node.js/Express). Dưới đây là toàn bộ các lệnh `npm` đã được sử dụng từ lúc khởi tạo dự án cho đến nay.

---

## 1. Môi trường Frontend (Thư mục gốc: `c:\sk`)

Khu vực này chứa mã nguồn giao diện người dùng, được build bằng công cụ siêu tốc **Vite**.

### Khởi tạo và chạy dự án cơ bản
*   **`npm create vite@latest .`**
    *   *Ý nghĩa:* Khởi tạo một dự án Vite mới tinh ngay tại thư mục hiện tại (`.`). Lệnh này tạo ra cấu trúc thư mục, file `index.html`, `main.js`, và `package.json` cơ bản.
*   **`npm install`** (hoặc `npm i`)
    *   *Ý nghĩa:* Cài đặt toàn bộ các thư viện (dependencies) được khai báo trong file `package.json` vào thư mục `node_modules`. Lệnh này thường chạy ngay sau khi clone source code về hoặc khởi tạo dự án.
*   **`npm run dev`**
    *   *Ý nghĩa:* Khởi động máy chủ phát triển cục bộ (Local Development Server) của Vite. Lệnh này giúp bạn xem trực tiếp giao diện web trên trình duyệt (thường ở cổng `localhost:5173` hoặc `localhost:3000`) và tự động tải lại trang (Hot Reload) mỗi khi bạn lưu file code.

### Cài đặt các thư viện bổ sung (Dependencies)
Đây là các thư viện được tải về để phục vụ các tính năng cụ thể của Frontend:

*   **`npm install axios`**
    *   *Ý nghĩa:* Cài đặt thư viện `axios`, dùng để gửi các HTTP Request (GET, POST, PUT, DELETE...) từ Frontend lên Backend (ví dụ: gọi API Đăng nhập, API lấy bài học).
*   **`npm install @google/generative-ai`**
    *   *Ý nghĩa:* Cài đặt SDK của Google Gemini AI. *(Lưu ý: Thư viện này từng được dùng để gọi AI chấm điểm, hiện tại dự án không còn dùng AI nữa nên có thể gỡ bỏ nếu muốn bằng lệnh `npm uninstall @google/generative-ai`)*.
*   **`npm install google-translate-api-x`**
    *   *Ý nghĩa:* Thư viện hỗ trợ dịch thuật tự động (dùng cho tính năng dịch từ vựng tiếng Nhật/Anh sang tiếng Việt).
*   **`npm install -D pdf-parse pdf2json`**
    *   *Ý nghĩa:* Cài đặt các công cụ giúp đọc và trích xuất dữ liệu chữ từ file PDF (dành cho tính năng Tải lên file kịch bản PDF). Hậu tố `-D` nghĩa là cài đặt vào `devDependencies` (chỉ dùng trong quá trình code, không gói vào bản build chính thức).

---

## 2. Môi trường Backend (Thư mục: `c:\sk\server`)

Khu vực này chứa máy chủ Node.js kết nối với cơ sở dữ liệu MongoDB và xử lý logic xác thực, lưu trữ tiến độ. Để chạy các lệnh này, bạn phải dùng lệnh `cd server` để di chuyển vào thư mục `server` trước.

### Khởi tạo và chạy Server
*   **`npm init -y`**
    *   *Ý nghĩa:* Khởi tạo một dự án Node.js mới tinh trong thư mục `server`. Nó tự động tạo ra file `package.json` với các cấu hình mặc định (bỏ qua bước hỏi đáp dài dòng nhờ cờ `-y`).
*   **`npm install`**
    *   *Ý nghĩa:* Giống như Frontend, lệnh này dùng để cài đặt tất cả thư viện cần thiết cho server khi bạn mang source code sang máy khác.
*   **`node server.js`** (hoặc khai báo lệnh `npm run dev` trong package.json)
    *   *Ý nghĩa:* Lệnh gốc của Node.js để chạy file `server.js`, khởi động máy chủ API ở cổng `localhost:5000` và kết nối với MongoDB.

### Cài đặt các thư viện thiết yếu cho Backend
Đây là một tổ hợp các thư viện nền tảng tạo nên Backend của DictaFlow, được cài bằng lệnh: 
> `npm install express mongoose cors dotenv bcryptjs jsonwebtoken axios uuid youtube-dl-exec nodemailer`

Giải thích chi tiết từng thư viện trong lệnh trên:
*   **`express`**: Framework cốt lõi để xây dựng máy chủ web và các API Router (như `/api/auth/login`).
*   **`mongoose`**: Thư viện ODM (Object Data Modeling) giúp kết nối và thao tác với cơ sở dữ liệu MongoDB dễ dàng qua các Schema (như `User`, `Lesson`).
*   **`cors`**: Middleware bảo mật giúp cho phép Frontend (đang chạy ở cổng 3000) có quyền gửi API sang Backend (đang chạy ở cổng 5000) mà không bị trình duyệt chặn lỗi Cross-Origin.
*   **`dotenv`**: Giúp Node.js đọc được các biến môi trường nhạy cảm từ file `.env` (như link kết nối DB, mật khẩu JWT, port).
*   **`bcryptjs`**: Thư viện dùng để băm (mã hóa) mật khẩu của người dùng thành các chuỗi ký tự vô nghĩa trước khi lưu vào DB, đảm bảo bảo mật không bị lộ mật khẩu.
*   **`jsonwebtoken`**: (Hay gọi tắt là JWT). Dùng để tạo ra các Token bảo mật cấp cho người dùng sau khi đăng nhập thành công. Token này giống như "thẻ căn cước" để gọi các API khác.
*   **`uuid`**: Thư viện tạo ra các chuỗi ID ngẫu nhiên, độc nhất vô nhị (dùng để gán ID cho bài học, ID câu văn...).
*   **`youtube-dl-exec`**: Thư viện hỗ trợ trích xuất luồng âm thanh/video trực tiếp từ link YouTube, phục vụ tính năng "Tạo bài học từ link YouTube".
*   **`nodemailer`**: Thư viện chuyên trị việc gửi Email tự động từ Node.js. Vừa được chúng ta cài đặt để phục vụ tính năng gửi mã OTP xác minh tài khoản!

---
*Văn bản này được tự động tạo và tổng hợp dựa trên lịch sử cấu trúc dự án. Bạn có thể sử dụng file này như một tài liệu bàn giao (handover document).*
