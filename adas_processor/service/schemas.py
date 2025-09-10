# service/schemas.py
from pydantic import BaseModel
from typing import List, Optional

class ProcessRequest(BaseModel):
    filepath: str
    vehicleId: str
    simulationId: str
    userId: str

class SensorData(BaseModel):
    vehicleId: str
    simulationId: str
    userId: str
    timestamp: str
    speed: Optional[float]            # allow None / negative
    distance_to_object: Optional[float]
    lane_status: Optional[str]
    obstacle_detected: bool
    camera_frame_url: Optional[str]
    ttc: Optional[float] = None
    track_id: Optional[int] = None
    frame_index: Optional[int] = None
    warn: Optional[bool] = False

class Alert(BaseModel):
    type: str
    description: str
    severity: str
    track_id: Optional[int] = None

class ProcessResponse(BaseModel):
    status: str
    summary: dict
    sensorData: List[SensorData]
    alerts: List[Alert]
    videoUrl: Optional[str]
