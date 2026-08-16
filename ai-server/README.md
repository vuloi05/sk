# 🤖 DictaFlow AI Server

Máy chủ AI chuyên biệt cho phiên âm tiếng Anh (Speech-to-Text), sử dụng mô hình **Nvidia Parakeet-TDT 0.6B v3**.

Server này hoạt động **độc lập** với Backend Node.js chính, giao tiếp qua HTTP API.

---

## Yêu cầu Phần cứng

| Thành phần | Yêu cầu tối thiểu |
|---|---|
| GPU | NVIDIA GPU có ≥ 4GB VRAM (VD: RTX 3050, RTX 3060...) |
| RAM | ≥ 8GB |
| Ổ cứng | ≥ 5GB trống (cho mô hình AI + cache) |

---

## Hướng dẫn Cài đặt (Windows)

### Bước 1: Cài đặt Python 3.11

```powershell
winget install Python.Python.3.11
```

> **Quan trọng:** Sau khi cài, đóng và mở lại Terminal/VS Code để nhận biến PATH.

Kiểm tra:
```powershell
python --version
# Kết quả mong đợi: Python 3.11.x
```

### Bước 2: Cài đặt CUDA Toolkit

1. Truy cập: https://developer.nvidia.com/cuda-downloads
2. Chọn: Windows → x86_64 → 11 → exe (local)
3. Tải và cài đặt (chọn Express Install).

Kiểm tra:
```powershell
nvcc --version
# Kết quả mong đợi: Cuda compilation tools, release 12.x
```

### Bước 3: Cài đặt FFmpeg

```powershell
winget install ffmpeg
```

Kiểm tra:
```powershell
ffmpeg -version
```

### Bước 4: Tạo môi trường ảo Python

```powershell
cd ai-server
python -m venv venv
.\venv\Scripts\activate
```

### Bước 5: Cài đặt PyTorch có hỗ trợ CUDA

```powershell
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
```

Kiểm tra GPU:
```powershell
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}, GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"None\"}')"
# Kết quả mong đợi: CUDA: True, GPU: NVIDIA GeForce RTX 3050 Laptop GPU
```

### Bước 6: Cài đặt các thư viện còn lại

```powershell
pip install -r requirements.txt
```

---

## Khởi chạy AI Server

```powershell
cd ai-server
.\venv\Scripts\activate
python main.py
```

> **Lần đầu tiên chạy**, hệ thống sẽ tự động tải mô hình Parakeet-TDT (~1.2GB) từ Hugging Face về thư mục cache. Các lần sau sẽ khởi động nhanh hơn nhiều.

Khi thấy dòng log:
```
🚀 AI Server sẵn sàng phục vụ!
```
→ Server đã sẵn sàng nhận yêu cầu tại `http://localhost:8000`.

---

## API Endpoints

### `GET /health`
Kiểm tra trạng thái server và GPU.

```bash
curl http://localhost:8000/health
```

### `POST /transcribe`
Phiên âm file audio thành text kèm timestamps.

```bash
curl -X POST http://localhost:8000/transcribe \
  -F "file=@audio.wav"
```

**Response:**
```json
{
  "segments": [
    { "text": "Hello, how are you?", "start": 0.0, "end": 1.52 },
    { "text": "I'm doing great, thanks.", "start": 1.80, "end": 3.41 }
  ],
  "duration": 3.41,
  "language": "en"
}
```

---

## Khắc phục sự cố

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `CUDA: False` | PyTorch không hỗ trợ GPU | Cài lại PyTorch với `--index-url cu121` |
| `OOM (Out of Memory)` | Audio quá dài cho 4GB VRAM | Thử video ngắn hơn (<15 phút) |
| `ffmpeg not found` | Chưa cài ffmpeg | `winget install ffmpeg` |
| Model download chậm | Mạng yếu | Kiên nhẫn, chỉ cần tải 1 lần |
