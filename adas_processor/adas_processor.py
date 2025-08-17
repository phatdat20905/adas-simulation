from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from utils.video_processor import process_media
from utils.logger import setup_logger
from pathlib import Path
import os
import time

app = FastAPI()
logger = setup_logger()

# Input model
class ProcessRequest(BaseModel):
    filepath: str
    vehicleId: str
    simulationId: str
    userId: str

# Output model
class SensorData(BaseModel):
    vehicleId: str
    simulationId: str
    userId: str
    timestamp: str
    speed: float
    distance_to_object: Optional[float]
    lane_status: str
    obstacle_detected: bool
    camera_frame_url: Optional[str]

class Alert(BaseModel):
    type: str
    description: str
    severity: str

class ProcessResponse(BaseModel):
    status: str
    summary: dict
    sensorData: List[SensorData]
    alerts: List[Alert]

@app.post("/process", response_model=ProcessResponse)
async def process_adas(request: ProcessRequest):
    start_time = time.time()
    try:
        # Điều chỉnh filepath để khớp với server/Uploads
        filepath = str(Path(__file__).parent.parent / "server" / request.filepath.lstrip("/"))
        vehicle_id = request.vehicleId
        simulation_id = request.simulationId
        user_id = request.userId

        logger.info(f"Starting processing for file: {filepath}, simulation: {simulation_id}")

        if not os.path.exists(filepath):
            logger.error(f"File not found: {filepath}")
            raise HTTPException(status_code=404, detail="File not found")

        result, _, _ = process_media(filepath, vehicle_id, simulation_id, user_id)
        processing_time = time.time() - start_time
        logger.info(f"Processing completed for simulation {simulation_id}: {result['summary']['totalAlerts']} alerts in {processing_time:.2f}s")

        return result
    except HTTPException as e:
        logger.error(f"HTTP error: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)