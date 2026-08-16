"""
DictaFlow AI Server — Parakeet-TDT 0.6B v3
FastAPI microservice for English speech-to-text transcription.

Chạy trên GPU NVIDIA RTX 3050 (4GB VRAM).
Mô hình được tải 1 lần duy nhất khi khởi động và giữ trong VRAM.
"""

import os
import tempfile
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Cấu hình thư mục cache cục bộ cho Hugging Face (Phải đặt TRƯỚC khi import nemo/torch)
# Điều này giúp model tải thẳng vào thư mục dự án thay vì thư mục hệ thống (C:\Users\...) -> Dễ deploy.
os.environ["HF_HOME"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_cache")

import torch
import nemo.collections.asr as nemo_asr
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydub import AudioSegment

# ──────────────────────────────────────────────
# Cấu hình
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("ai-server")

# Hằng số
MODEL_NAME = "nvidia/parakeet-tdt-0.6b-v3"
CHUNK_DURATION_MS = 30_000   # 30 giây mỗi chunk (an toàn cho 4GB VRAM)
OVERLAP_MS = 1_500           # 1.5 giây chồng lấn giữa các chunk (tránh cắt ngang từ)
SAMPLE_RATE = 16_000         # Tần số lấy mẫu yêu cầu bởi Parakeet
MAX_AUDIO_DURATION_S = 7200  # Giới hạn 2 giờ

# Biến toàn cục chứa mô hình AI
asr_model = None


# ──────────────────────────────────────────────
# Vòng đời ứng dụng (Startup / Shutdown)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Tải mô hình vào GPU khi server khởi động, giải phóng khi tắt."""
    global asr_model

    logger.info("🔄 Đang tải mô hình Parakeet-TDT 0.6B v3...")
    logger.info(f"   PyTorch version: {torch.__version__}")
    logger.info(f"   CUDA available: {torch.cuda.is_available()}")

    # Tải mô hình từ Hugging Face (lần đầu sẽ download ~1.2GB, sau đó đọc từ cache)
    asr_model = nemo_asr.models.ASRModel.from_pretrained(model_name=MODEL_NAME)

    # Đưa lên GPU
    if torch.cuda.is_available():
        asr_model = asr_model.cuda()
        gpu_name = torch.cuda.get_device_name(0)
        vram_used = torch.cuda.memory_allocated(0) / 1024**2
        vram_total = torch.cuda.get_device_properties(0).total_memory / 1024**2
        logger.info(f"✅ Mô hình đã tải lên GPU: {gpu_name}")
        logger.info(f"   VRAM sử dụng: {vram_used:.0f} MB / {vram_total:.0f} MB")
    else:
        logger.warning("⚠️ Không phát hiện GPU! Chạy trên CPU sẽ rất chậm.")

    # Bật Local Attention để xử lý audio dài mà không tràn VRAM
    asr_model.change_attention_model(
        self_attention_model="rel_pos_local_attn",
        att_context_size=[256, 256]
    )

    asr_model.eval()
    logger.info("🚀 AI Server sẵn sàng phục vụ!")

    yield  # Server chạy ở đây

    # Dọn dẹp khi tắt
    del asr_model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    logger.info("🛑 AI Server đã dừng.")


# ──────────────────────────────────────────────
# Khởi tạo FastAPI
# ──────────────────────────────────────────────
app = FastAPI(
    title="DictaFlow AI Server",
    description="Speech-to-Text powered by Nvidia Parakeet-TDT 0.6B v3",
    version="1.0.0",
    lifespan=lifespan
)


# ──────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Kiểm tra trạng thái server và GPU."""
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "name": torch.cuda.get_device_name(0),
            "vram_total_mb": round(torch.cuda.get_device_properties(0).total_mem / 1024**2),
            "vram_used_mb": round(torch.cuda.memory_allocated(0) / 1024**2),
            "vram_cached_mb": round(torch.cuda.memory_reserved(0) / 1024**2),
        }

    return {
        "status": "ok",
        "model": MODEL_NAME,
        "model_loaded": asr_model is not None,
        "gpu": gpu_info
    }


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Phiên âm file audio thành văn bản kèm timestamps.

    - Đầu vào: File audio (.wav, .mp3, .flac, .ogg, .m4a)
    - Đầu ra: JSON chứa mảng segments [{ text, start, end }]

    Audio ngắn (≤ 60s): Xử lý trực tiếp.
    Audio dài (> 60s): Tự động chia nhỏ thành chunks ~30s để vừa 4GB VRAM.
    """
    if asr_model is None:
        raise HTTPException(status_code=503, detail="Mô hình chưa được tải")

    # Lưu file upload vào thư mục tạm
    suffix = Path(file.filename).suffix or ".wav"
    temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    wav_path = None

    try:
        content = await file.read()
        temp_input.write(content)
        temp_input.close()

        # Chuyển đổi sang WAV 16kHz mono (chuẩn đầu vào của Parakeet)
        wav_path = _convert_to_wav_16k_mono(temp_input.name)

        # Đo thời lượng audio
        audio = AudioSegment.from_wav(wav_path)
        duration_s = len(audio) / 1000.0
        logger.info(f"📎 Thời lượng audio: {duration_s:.1f}s")

        if duration_s > MAX_AUDIO_DURATION_S:
            raise HTTPException(
                status_code=400,
                detail=f"Audio quá dài ({duration_s:.0f}s). Giới hạn: {MAX_AUDIO_DURATION_S}s"
            )

        # Phiên âm
        if duration_s <= 60:
            segments = _transcribe_single(wav_path)
        else:
            segments = _transcribe_chunked(wav_path, audio)

        logger.info(f"✅ Phiên âm xong: {len(segments)} đoạn")

        return JSONResponse(content={
            "segments": segments,
            "duration": round(duration_s, 2),
            "language": "en"
        })

    except HTTPException:
        raise
    except torch.cuda.OutOfMemoryError:
        torch.cuda.empty_cache()
        logger.error("❌ Tràn bộ nhớ GPU (OOM)! Hãy thử video ngắn hơn.")
        raise HTTPException(status_code=507, detail="GPU hết bộ nhớ. Hãy thử video ngắn hơn.")
    except Exception as e:
        logger.error(f"❌ Lỗi phiên âm: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        _safe_delete(temp_input.name)
        if wav_path and wav_path != temp_input.name:
            _safe_delete(wav_path)


# ──────────────────────────────────────────────
# Hàm xử lý nội bộ
# ──────────────────────────────────────────────
def _convert_to_wav_16k_mono(filepath: str) -> str:
    """Chuyển đổi audio sang WAV 16kHz mono (chuẩn đầu vào Parakeet)."""
    audio = AudioSegment.from_file(filepath)
    audio = audio.set_frame_rate(SAMPLE_RATE).set_channels(1)

    wav_path = filepath.rsplit('.', 1)[0] + "_16k.wav"
    audio.export(wav_path, format="wav")
    return wav_path


def _transcribe_single(filepath: str) -> list:
    """Phiên âm trực tiếp 1 file audio ngắn (≤ 60s)."""
    with torch.no_grad():
        output = asr_model.transcribe([filepath], timestamps=True)

    return _extract_segments(output)


def _transcribe_chunked(wav_path: str, audio: AudioSegment) -> list:
    """
    Phiên âm audio dài bằng kỹ thuật chia nhỏ (chunking).

    Audio được chia thành các đoạn ~30s với 1.5s chồng lấn ở mỗi mép.
    Timestamps của mỗi chunk được cộng thêm offset tương ứng.
    Các đoạn trùng lặp do chồng lấn được loại bỏ tự động.
    """
    all_segments = []
    total_ms = len(audio)
    chunk_start_ms = 0
    chunk_index = 0

    logger.info(f"📦 Chia audio ({total_ms/1000:.0f}s) thành các chunk ~{CHUNK_DURATION_MS/1000:.0f}s")

    while chunk_start_ms < total_ms:
        chunk_end_ms = min(chunk_start_ms + CHUNK_DURATION_MS, total_ms)
        chunk = audio[chunk_start_ms:chunk_end_ms]

        # Lưu chunk vào file tạm
        chunk_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
        chunk.export(chunk_path, format="wav")

        try:
            # Phiên âm chunk
            with torch.no_grad():
                output = asr_model.transcribe([chunk_path], timestamps=True)

            chunk_segments = _extract_segments(output)

            # Điều chỉnh timestamps (cộng offset của chunk)
            offset_s = chunk_start_ms / 1000.0
            for seg in chunk_segments:
                seg['start'] = round(seg['start'] + offset_s, 2)
                seg['end'] = round(seg['end'] + offset_s, 2)
                all_segments.append(seg)

            chunk_index += 1
            logger.info(
                f"   Chunk {chunk_index}: "
                f"{chunk_start_ms/1000:.0f}s → {chunk_end_ms/1000:.0f}s | "
                f"{len(chunk_segments)} đoạn"
            )

            # Giải phóng bộ nhớ GPU sau mỗi chunk
            torch.cuda.empty_cache()

        finally:
            _safe_delete(chunk_path)

        # Di chuyển tới chunk tiếp theo (trừ phần chồng lấn)
        chunk_start_ms = chunk_end_ms - OVERLAP_MS
        if chunk_end_ms >= total_ms:
            break

    # Loại bỏ các đoạn trùng lặp do chồng lấn
    all_segments = _deduplicate_segments(all_segments)

    return all_segments


def _extract_segments(output) -> list:
    """Trích xuất danh sách segments từ kết quả NeMo."""
    segments = []

    if not output or not output[0]:
        return segments

    # Ưu tiên segment-level timestamps (mỗi câu hoàn chỉnh)
    if hasattr(output[0], 'timestamp') and output[0].timestamp:
        ts = output[0].timestamp
        if 'segment' in ts and ts['segment']:
            for stamp in ts['segment']:
                text = stamp.get('segment', '').strip()
                if text:
                    segments.append({
                        "text": text,
                        "start": round(stamp.get('start', 0), 2),
                        "end": round(stamp.get('end', 0), 2)
                    })
            return segments

    # Fallback: Toàn bộ text dưới dạng 1 segment
    if hasattr(output[0], 'text') and output[0].text:
        segments.append({
            "text": output[0].text.strip(),
            "start": 0.0,
            "end": 0.0
        })

    return segments


def _deduplicate_segments(segments: list) -> list:
    """
    Loại bỏ các đoạn trùng lặp xuất hiện do vùng chồng lấn giữa các chunk.
    So sánh dựa trên thời gian bắt đầu và nội dung text.
    """
    if len(segments) <= 1:
        return segments

    deduped = [segments[0]]

    for seg in segments[1:]:
        prev = deduped[-1]

        # Bỏ qua nếu đoạn này bắt đầu trước khi đoạn trước kết thúc
        # VÀ có nội dung giống hệt (trùng lặp từ vùng chồng lấn)
        if seg['start'] < prev['end'] and seg['text'] == prev['text']:
            continue

        # Nếu thời gian chồng lấn nhưng text khác, điều chỉnh thời điểm bắt đầu
        if seg['start'] < prev['end']:
            seg['start'] = prev['end']

        deduped.append(seg)

    return deduped


def _safe_delete(filepath: str):
    """Xóa file an toàn, bỏ qua lỗi."""
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass


# ──────────────────────────────────────────────
# Điểm khởi chạy
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("AI_SERVER_PORT", 8000))
    logger.info(f"🎯 Khởi chạy AI Server trên port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
