import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
from pathlib import Path
import datetime
import os

app = FastAPI()

# Load YOLO model
model = YOLO("yolov8n.pt")  # Use yolov8n.pt or custom model

# Input model
class ProcessRequest(BaseModel):
    filepath: str
    vehicleId: str
    simulationId: str
    userId: str

# Output model
class ProcessResponse(BaseModel):
    status: str
    summary: dict
    sensorData: list
    alerts: list

def detect_lanes(frame):
    """Basic lane detection using Hough Transform"""
    try:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)
        
        lane_status = "within"
        lane_points = []
        
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                lane_points.append([[x1, y1], [x2, y2]])
                # Simplified lane status logic
                if abs(x1 - x2) > frame.shape[1] * 0.1:  # Significant horizontal movement
                    lane_status = "departing"
        
        return lane_status, lane_points
    except Exception as e:
        return "within", []  # Fallback if lane detection fails

def process_image(frame, vehicle_id, simulation_id, user_id, timestamp, frames_dir):
    """Process a single frame/image"""
    objects = []
    obstacle_detected = False
    min_distance = float("inf")
    
    # YOLO object detection
    results = model(frame)
    for result in results:
        for box in result.boxes:
            class_name = model.names[int(box.cls)]
            confidence = float(box.conf)
            bbox = box.xywh[0].tolist()  # [x, y, w, h]
            objects.append({"type": class_name, "bbox": bbox, "confidence": confidence})
            obstacle_detected = True
            distance = 1000 / bbox[3] if bbox[3] > 0 else float("inf")
            min_distance = min(min_distance, distance)

    # Lane detection
    lane_status, lane_points = detect_lanes(frame)

    # Mock speed (replace with actual metadata or ML model)
    speed = 40.0  # km/h

    # Determine alert level
    alert_level = "none"
    alert_type = None
    alert_description = None
    if obstacle_detected and min_distance < 5:
        alert_level = "high"
        alert_type = "collision"
        alert_description = f"Collision risk with {objects[0]['type']} at {min_distance:.1f}m"
    elif obstacle_detected and min_distance < 10:
        alert_level = "low"
        alert_type = "obstacle"
        alert_description = f"Obstacle ({objects[0]['type']}) detected at {min_distance:.1f}m"
    elif lane_status in ["departing", "crossed"]:
        alert_level = "low"
        alert_type = "lane_departure"
        alert_description = f"Lane departure detected: {lane_status}"

    # Save frame if alert
    frame_url = None
    alerts = []
    if alert_level != "none":
        frame_filename = f"frame_{simulation_id}_{timestamp.isoformat().replace(':', '-')}.jpg"
        frame_path = str(frames_dir / frame_filename)
        cv2.imwrite(frame_path, frame)
        frame_url = f"/Uploads/frames/{frame_filename}"
        alerts.append({
            "type": alert_type,
            "description": alert_description,
            "severity": alert_level,
            "simulationId": simulation_id,
            "vehicleId": vehicle_id,
            "userId": user_id,
        })

    return {
        "timestamp": timestamp.isoformat(),
        "speed": speed,
        "distance_to_object": min_distance if obstacle_detected else None,
        "lane_status": lane_status,
        "obstacle_detected": obstacle_detected,
        "camera_frame_url": frame_url,
        "alertLevel": alert_level,
        "vehicleId": vehicle_id,
        "simulationId": simulation_id,
        "userId": user_id,
    }, alerts, objects, lane_points

@app.post("/process", response_model=ProcessResponse)
async def process_adas(request: ProcessRequest):
    try:
        filepath = request.filepath
        vehicle_id = request.vehicleId
        simulation_id = request.simulationId
        user_id = request.userId

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")

        # Initialize results
        summary = {"objects": [], "lanes": []}
        sensor_data = []
        alerts = []

        frames_dir = Path(filepath).parent / "frames"
        os.makedirs(frames_dir, exist_ok=True)

        # Check if input is image or video
        if filepath.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Process single image
            frame = cv2.imread(filepath)
            if frame is None:
                raise HTTPException(status_code=400, detail="Cannot open image")
            
            timestamp = datetime.datetime.now()
            sensor_entry, frame_alerts, objects, lane_points = process_image(
                frame, vehicle_id, simulation_id, user_id, timestamp, frames_dir
            )
            sensor_data.append(sensor_entry)
            alerts.extend(frame_alerts)
            summary["objects"] = objects
            summary["lanes"] = [{"type": "solid", "points": lane_points}]
        else:
            # Process video
            cap = cv2.VideoCapture(filepath)
            if not cap.isOpened():
                raise HTTPException(status_code=400, detail="Cannot open video")

            frame_rate = cap.get(cv2.CAP_PROP_FPS) or 30
            frame_interval = 0.5  # Save sensor data every 0.5s
            frame_count = 0
            timestamp = datetime.datetime.now()

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % int(frame_rate * frame_interval) == 0:
                    frame_time = timestamp + datetime.timedelta(seconds=frame_count / frame_rate)
                    sensor_entry, frame_alerts, objects, lane_points = process_image(
                        frame, vehicle_id, simulation_id, user_id, frame_time, frames_dir
                    )
                    sensor_data.append(sensor_entry)
                    alerts.extend(frame_alerts)
                    if frame_count == 0:  # Save summary from first frame
                        summary["objects"] = objects
                        summary["lanes"] = [{"type": "solid", "points": lane_points}]

                frame_count += 1

            cap.release()

        return {
            "status": "completed",
            "summary": summary,
            "sensorData": sensor_data,
            "alerts": alerts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
