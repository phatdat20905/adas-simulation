from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from utils.video_processor import process_media
from utils.logger import setup_logger
from pathlib import Path
import os
import time
import cv2
import shutil
from config.config import FRAMES_DIR, VIDEOS_DIR

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
    videoUrl: Optional[str]

def create_video_from_frames(simulation_id: str, frames_dir: Path, output_dir: Path):
    """Create video from frames using OpenCV"""
    output_dir.mkdir(exist_ok=True, parents=True)
    output_video = str(output_dir / f"simulation_{simulation_id}.mp4")
    frame_files = sorted(frames_dir.glob(f"frame_{simulation_id}_*.jpg"))
    
    if not frame_files:
        logger.error(f"No frames found for simulation {simulation_id} in {frames_dir}")
        return None

    # Read first frame
    frame = cv2.imread(str(frame_files[0]))
    if frame is None:
        logger.error(f"Failed to read frame: {frame_files[0]}")
        return None

    height, width, _ = frame.shape
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, 10.0, (width, height))

    for frame_file in frame_files:
        frame = cv2.imread(str(frame_file))
        if frame is None:
            logger.warning(f"Skipping unreadable frame: {frame_file}")
            continue
        out.write(frame)
    
    out.release()
    if os.path.exists(output_video):
        logger.info(f"Video created: {output_video}")
        # ✅ Delete frames only after success
        shutil.rmtree(frames_dir, ignore_errors=True)
        return f"/Processed/videos/simulation_{simulation_id}.mp4"
    else:
        logger.error(f"Video creation failed: {output_video}")
        return None

@app.post("/process", response_model=ProcessResponse)
async def process_adas(request: ProcessRequest):
    start_time = time.time()
    try:
        filepath = str(Path(__file__).parent.parent / "server" / request.filepath.lstrip("/"))
        vehicle_id = request.vehicleId
        simulation_id = request.simulationId
        user_id = request.userId

        logger.info(f"Start processing file: {filepath}, simulation: {simulation_id}")

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")

        result, _, _ = process_media(filepath, vehicle_id, simulation_id, user_id)
        
        frames_dir = Path(FRAMES_DIR)
        output_dir = Path(VIDEOS_DIR)
        video_url = create_video_from_frames(simulation_id, frames_dir, output_dir)

        processing_time = time.time() - start_time
        logger.info(f"Processing completed for simulation {simulation_id}: {result['summary']['totalAlerts']} alerts in {processing_time:.2f}s")

        return {**result, "videoUrl": video_url}
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
