# 🚗 Python ADAS Service

## Cấu trúc
- `config/` - config chung
- `core/` - xử lý chính (detection, tracking, estimation, processing)
- `service/` - FastAPI service
- `utils/` - logger & helpers
- `demo/` - script test pipeline
- `models/` - YOLO models

## Cài đặt
```bash
pip install -r requirements.txt
uvicorn service.adas_service:app --host 0.0.0.0 --port 5001 --reload
