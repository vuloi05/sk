# Kế Hoạch Triển Khai: Hệ Thống Daily Streak & Gamification

Thiết lập hệ thống điểm danh, giữ chuỗi hằng ngày và tặng thưởng (Gamification) để gia tăng động lực học tập và tỷ lệ giữ chân người dùng trên DictaFlow.

## 1. Cơ Chế Hệ Thống Chi Tiết (System Mechanics)

### 1.1. Vòng Đời Của Một Chuỗi (Streak)
- **Tính chuỗi (Streak):** Hệ thống không ép buộc người dùng phải làm một bài cố định. Người dùng **chỉ cần hoàn thành 1 bài học bất kỳ** trong ngày là được tính điểm danh.
- **Đứt chuỗi (Broken Streak):** Ngay khi sang 00:00 ngày mới (theo giờ Máy chủ), nếu user chưa làm bài nào, `currentStreak` sẽ bị reset về 0 (trừ khi có thẻ khôi phục).

### 1.2. Giải Quyết Vấn Đề "Cày Lại Bài Cũ" (Re-do 100% Lessons)
Sự phân vân của bạn rất chính xác. Nếu cấm hoàn toàn, user sẽ không ôn tập lại bài cũ (trái với nguyên lý Spaced Repetition của việc học ngoại ngữ). Nếu cho phép thoải mái, user sẽ lạm dụng cày đi cày lại 1 bài dễ để giữ chuỗi. 
**👉 Giải pháp cân bằng đề xuất:**
- **Vẫn tính Chuỗi (Streak):** Nếu user làm lại một bài đã đạt 100% từ trước, hệ thống **VẪN CHẤP NHẬN** tính chuỗi điểm danh cho ngày hôm đó (khuyến khích việc ôn tập).
- **Giảm/Khóa phần thưởng D-coins:** Bài làm lại sẽ KHÔNG nhận được thưởng độ chính xác (+15 D-coins) nữa, vì họ đã thuộc lòng. 
- **Cơ chế Cooldown (Thời gian chờ):** Để chống việc user làm đi làm lại đúng 1 bài dễ *mỗi ngày*, ta thêm luật: **Một bài học đã đạt 100% chỉ được tính chuỗi ôn tập lại sau ít nhất 7 ngày kể từ lần làm cuối cùng.** Nếu làm lại quá sớm, bài đó sẽ không sinh ra bất kỳ tài nguyên hay chuỗi nào cả.

---

## 2. Hệ Thống Huy Hiệu (Badge System)
- **Huy hiệu Năm (Yearly Badges):** Thu thập đủ 12 Huy hiệu Tháng.
- **Huy hiệu Tháng (Monthly Badges):** Điểm danh ít nhất **25 ngày** trong tháng.
- **Huy hiệu Cột mốc Chuỗi (Streak Milestones):** Đạt các mốc chuỗi 7, 30, 100, 365 ngày.

---

## 3. Hệ Thống Tiền Tệ: D-coins & Anti-Abuse

### 3.1. Cơ chế Kiếm D-coins (Thu nhập)
- **Hoàn thành 1 bài học (Lần đầu trong ngày):** +20 D-coins.
- **Thưởng độ chính xác tuyệt đối:** Gõ đúng 100% **VÀ không sử dụng gợi ý**, nhận thêm +15 D-coins (Chỉ áp dụng cho bài mới hoặc bài chưa từng đạt 100%).
- **Chuỗi liên tiếp (Streak Bonus):** Đạt mốc 7 ngày, 30 ngày...

### 3.2. Cơ chế Tiêu D-coins (Chi tiêu)
- **Mua Thẻ khôi phục chuỗi (Streak Freeze):** Giá 300 D-coins (Rất đắt). Tối đa trữ 2 thẻ trong người.
- **Mua Gợi ý (Hints):** 5 D-coins / lần.
- **Đổi quà thực tế (Redeem).**

---

## 4. Giao diện (Frontend & UI)

### 4.1. Đánh dấu bài học & Lưu Tiến Độ (Save Progress & Resume)
Bạn đã chỉ ra một điểm yếu rất chí mạng về mặt trải nghiệm UX đối với các bài học dài. Bắt người dùng làm lại từ câu 1 nếu họ lỡ tay tắt web là một thảm họa.
**👉 Giải pháp bổ sung:**
- **Lưu Tiến Độ Tự Động (Auto-Save):** Quá trình làm bài của user sẽ được lưu tự động sau mỗi câu họ gõ xong (Lưu vào LocalStorage trên trình duyệt để phản hồi nhanh, đồng thời đồng bộ lên Database).
- **Tính Năng Tiếp Tục (Resume):** Khi user bấm vào một bài học 🟡 **In Progress (Đang học dở)**, hệ thống sẽ hiện ra hộp thoại hỏi: *"Bạn đang làm bài này tới Câu số 45. Bạn muốn **Làm Tiếp** hay **Làm Lại Từ Đầu**?"*. Nếu bấm Làm Tiếp, video sẽ tự động tua tới đúng đoạn câu 45 đó.
- Nhằm giúp người dùng dễ dàng theo dõi tiến độ, Thư viện bài học (`LessonLibrary`) sẽ được bổ sung thêm một **Biểu tượng đánh dấu (Tag/Icon)** góc trên các thẻ bài học.
  - 🟢 **Mastered (Hoàn thành 100%):** Bài đã làm đúng hoàn toàn không cần gợi ý.
  - 🟡 **In Progress (Đang học dở):** Đã làm nhưng chưa đạt 100% (Hoặc đang làm dở giữa chừng).

### 4.2. Các UI Widget khác
- **Vị trí Lịch điểm danh:** Đặt hiển thị trực tiếp ngay ở Màn hình chính (Thư viện).
- **Bảng Xếp Hạng (Leaderboard):** Danh sách Top 10 User có Chuỗi dài nhất hệ thống.

---

## 5. Proposed Code Changes (Kế hoạch Mã nguồn)

### Backend (Node.js & MongoDB)
- **`User` Schema:** Thêm `badges` (Array), `dCoins` (Number), `currentStreak`, `longestStreak`, `freezeCards` (Max: 2).
- **`Progress` Schema:** Lưu trữ tiến độ học của user cho từng bài `userId, lessonId, highestScore, lastPlayedAt, isMastered`. **Bổ sung thêm trường `currentSentenceIndex` (để lưu vị trí câu đang làm dở) và `savedAnswers` (để lưu lại các đáp án họ đã gõ vào hộp thoại).**
- **APIs:** Cập nhật API lấy danh sách thư viện để lồng thêm trạng thái `isMastered` / `In Progress` trả về cho Frontend. Thêm API xử lý chuỗi và D-coins. Cập nhật API Lưu Tiến Độ.

### Frontend (Vite)
- **`DictationMode` Component:** Code thêm logic `Auto-Save` mỗi khi user gõ xong 1 câu. Bổ sung Modal hỏi "Làm tiếp/Làm lại".
- **`LessonLibrary` Component:** Bổ sung code render Tag 🟢/🟡 dựa trên dữ liệu từ Backend gửi về.
- **`DailyCalendar` & `Leaderboard` Component.**

> [!TIP]
> Xin hãy bấm **Proceed** nếu bạn đồng ý với tính năng Auto-Save và Resume cực kỳ cần thiết này. Tôi đã bao trọn cả logic Frontend và Backend để xử lý mượt mà nhất!
