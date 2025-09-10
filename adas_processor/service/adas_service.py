# service/adas_service.py
from fastapi import FastAPI, HTTPException
from pathlib import Path
from config.config import VIDEOS_DIR, YOLO_MODEL_PATH, TRAFFIC_SIGN_MODEL_PATH, DEVICE
from core.processing import ADASProcessor
from service.schemas import ProcessRequest, ProcessResponse
from utils.logger import get_logger
import time

logger = get_logger("ADASService")
app = FastAPI()

# Thư mục gốc project
BASE_DIR = Path(__file__).resolve().parent.parent
# Thư mục upload video từ NodeJS
UPLOADS_DIR = BASE_DIR.parent / "server" / "Uploads" / "videos"


@app.post("/process", response_model=ProcessResponse)
async def process_adas(request: ProcessRequest):
    start_time = time.time()
    try:
        filepath = Path(request.filepath)

        # 🔹 Chuẩn hóa lại đường dẫn
        if str(filepath).startswith("/Uploads/videos"):
            filepath = UPLOADS_DIR / filepath.name
        elif not filepath.is_absolute():
            filepath = UPLOADS_DIR / filepath.name

        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {filepath}")

        logger.info(f"▶️ Processing simulation {request.simulationId} with file: {filepath}")

        # 🔹 Đường dẫn video output (final video sẽ nằm ở đây sau khi finalize)
        output_path = VIDEOS_DIR / f"simulation_{request.simulationId}.mp4"

        # 🔹 Khởi tạo ADAS Processor và chạy
        processor = ADASProcessor(YOLO_MODEL_PATH, TRAFFIC_SIGN_MODEL_PATH, DEVICE)
        result = processor.run(
            str(filepath),
            str(output_path),
            request.simulationId,
            request.vehicleId,
            request.userId
        )

        processing_time = time.time() - start_time
        logger.info(f"✅ Simulation {request.simulationId} completed in {processing_time:.2f}s")

        # result đã có videoUrl nên chỉ cần trả thẳng ra
        return result

    except Exception as e:
        logger.error(f"❌ Error processing ADAS: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
