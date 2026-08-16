# Tổng hợp Lệnh NPM sử dụng trong dự án DictaFlow

Dự án DictaFlow được thiết kế theo mô hình **Monorepo**, chia thành 2 không gian làm việc (Workspaces) tách biệt: **Frontend** (giao diện web sử dụng Vite/Vanilla JS trong thư mục `client/`) và **Backend** (máy chủ xử lý API sử dụng Node.js/Express trong thư mục `server/`). Cả hai được điều phối chung bởi một file `package.json` ở thư mục gốc.

Dưới đây là toàn bộ các lệnh `npm` được sử dụng trong hệ thống:

---

## 1. Lệnh khởi chạy Dự án Tự động (Mới)

Vì dự án đã được chuyển sang kiến trúc Monorepo Workspace, bạn **KHÔNG CẦN** phải mở 2 terminal để chạy riêng biệt như trước đây. Mọi thứ đã được tự động hóa.

Mở một Terminal duy nhất tại thư mục gốc của dự án (`c:\sk`):
```bash
npm run dev
```
*Ý nghĩa:* Lệnh này sẽ sử dụng thư viện `concurrently` để chạy ngầm 2 lệnh `npm run dev --workspace=server` và `npm run dev --workspace=client` cùng một lúc. Máy chủ Backend (Port 5000) và Frontend (Port 3000) sẽ tự động được khởi động song song trong cùng một màn hình terminal.

---

## 2. Môi trường Frontend (Thư mục: `c:\sk\client`)

Khu vực này chứa mã nguồn giao diện người dùng, được build bằng công cụ siêu tốc **Vite**.

### Cài đặt các thư viện bổ sung (Dependencies)
Đây là các thư viện được tải về để phục vụ các tính năng cụ thể của Frontend:

*   **`npm install axios --workspace=client`**
    *   *Ý nghĩa:* Cài đặt thư viện `axios` vào frontend, dùng để gửi các HTTP Request (GET, POST, PUT, DELETE...) từ Frontend lên Backend.
*   **`npm install google-translate-api-x --workspace=client`**
    *   *Ý nghĩa:* Thư viện hỗ trợ dịch thuật tự động (dùng cho tính năng dịch từ vựng tiếng Nhật/Anh sang tiếng Việt).
*   **`npm install -D pdf-parse pdf2json --workspace=client`**
    *   *Ý nghĩa:* Cài đặt các công cụ giúp đọc và trích xuất dữ liệu chữ từ file PDF. Hậu tố `-D` nghĩa là cài đặt vào `devDependencies` (chỉ dùng trong quá trình code, không gói vào bản build chính thức).

---

## 3. Môi trường Backend (Thư mục: `c:\sk\server`)

Khu vực này chứa máy chủ Node.js kết nối với cơ sở dữ liệu MongoDB và xử lý logic xác thực, lưu trữ tiến độ. 

### Cài đặt các thư viện thiết yếu cho Backend
Đây là một tổ hợp các thư viện nền tảng tạo nên Backend của DictaFlow, được cài bằng lệnh: 
> `npm install express mongoose cors dotenv bcryptjs jsonwebtoken axios uuid youtube-dl-exec nodemailer form-data --workspace=server`

Giải thích chi tiết từng thư viện trong lệnh trên:
*   **`express`**: Framework cốt lõi để xây dựng máy chủ web và các API Router.
*   **`mongoose`**: Thư viện ODM giúp kết nối và thao tác với cơ sở dữ liệu MongoDB.
*   **`cors`**: Middleware bảo mật giúp cho phép Frontend có quyền gửi API sang Backend mà không bị trình duyệt chặn lỗi Cross-Origin.
*   **`dotenv`**: Giúp Node.js đọc được các biến môi trường nhạy cảm từ file `.env` (như link kết nối DB, mật khẩu JWT, port).
*   **`bcryptjs`**: Thư viện dùng để băm (mã hóa) mật khẩu của người dùng thành các chuỗi ký tự vô nghĩa trước khi lưu vào DB.
*   **`jsonwebtoken`**: Dùng để tạo ra các Token bảo mật cấp cho người dùng sau khi đăng nhập thành công. 
*   **`uuid`**: Thư viện tạo ra các chuỗi ID ngẫu nhiên, độc nhất vô nhị.
*   **`youtube-dl-exec`**: Thư viện hỗ trợ trích xuất luồng âm thanh/video trực tiếp từ link YouTube, phục vụ tính năng "Tạo bài học từ link YouTube".
*   **`nodemailer`**: Thư viện chuyên trị việc gửi Email tự động từ Node.js (phục vụ gửi mã OTP xác minh tài khoản).
*   **`form-data`**: Thư viện cấu trúc dữ liệu gửi dạng biểu mẫu (upload file), dùng để gửi file audio từ Backend lên AI Server (Python) qua HTTP.

---
*Văn bản này đã được cập nhật để phản ánh cấu trúc Monorepo mới của dự án.*
