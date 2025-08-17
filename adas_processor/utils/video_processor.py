import cv2
import datetime
import numpy as np
from pathlib import Path
import shutil
from config.config import FRAME_INTERVAL, DISTANCE_THRESHOLD_COLLISION, DISTANCE_THRESHOLD_OBSTACLE, FRAMES_DIR
from utils.adas_algorithms import detect_lanes, detect_obstacles, detect_traffic_signs, estimate_speed
from utils.logger import setup_logger

logger = setup_logger()

def process_image(frame, vehicle_id, simulation_id, user_id, timestamp, frames_dir, prev_frame=None):
    """Process a single frame/image"""
    # Detect obstacles
    objects, obstacle_detected, min_distance = detect_obstacles(frame)

    # Detect lanes
    lane_status, lane_points = detect_lanes(frame)

    # Detect traffic signs
    traffic_sign = detect_traffic_signs(frame)

    # Estimate speed
    speed = estimate_speed(prev_frame, frame)

    # Determine alerts
    alerts = []
    alert_level = "none"
    alert_type = None
    alert_description = None
    frame_url = None

    # Luôn lưu frame để tạo video sau này
    frames_dir.mkdir(exist_ok=True)
    frame_filename = f"frame_{simulation_id}_{timestamp.isoformat().replace(':', '-')}.jpg"
    frame_path = frames_dir / frame_filename
    if cv2.imwrite(str(frame_path), frame):
        frame_url = f"/Uploads/frames/{frame_filename}"
        logger.info(f"Frame saved: {frame_path}")
    else:
        logger.error(f"Failed to save frame: {frame_path}")

    if obstacle_detected and min_distance < DISTANCE_THRESHOLD_COLLISION:
        alert_level = "high"
        alert_type = "collision"
        alert_description = f"Collision risk with {objects[0]['type']} at {min_distance:.1f}m"
    elif obstacle_detected and min_distance < DISTANCE_THRESHOLD_OBSTACLE:
        alert_level = "low"
        alert_type = "obstacle"
        alert_description = f"Obstacle ({objects[0]['type']}) detected at {min_distance:.1f}m"
    elif lane_status in ["departing", "crossed"]:
        alert_level = "low"
        alert_type = "lane_departure"
        alert_description = f"Lane departure detected: {lane_status}"
    elif traffic_sign:
        alert_level = "medium"
        alert_type = "traffic_sign"
        alert_description = f"Traffic sign ({traffic_sign['type']}) detected"

    if alert_level != "none":
        alerts.append({
            "type": alert_type,
            "description": alert_description,
            "severity": alert_level
        })

    sensor_entry = {
        "vehicleId": vehicle_id,
        "simulationId": simulation_id,
        "userId": user_id,
        "timestamp": timestamp.isoformat(),
        "speed": speed,
        "distance_to_object": min_distance if obstacle_detected else None,
        "lane_status": lane_status,
        "obstacle_detected": obstacle_detected,
        "camera_frame_url": frame_url
    }

    return sensor_entry, alerts, objects, lane_points

def process_media(filepath, vehicle_id, simulation_id, user_id):
    """Process video or image with batch processing"""
    frames_dir = Path(FRAMES_DIR)
    frames_dir.mkdir(exist_ok=True)

    total_alerts = 0
    collision_count = 0
    lane_departure_count = 0
    obstacle_count = 0
    traffic_sign_count = 0
    sensor_data = []
    alerts = []
    first_objects = []
    first_lane_points = []

    try:
        if filepath.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Process single image
            frame = cv2.imread(filepath)
            if frame is None:
                logger.error(f"Cannot open image: {filepath}")
                raise ValueError("Cannot open image")
            
            timestamp = datetime.datetime.now()
            sensor_entry, frame_alerts, objects, lane_points = process_image(
                frame, vehicle_id, simulation_id, user_id, timestamp, frames_dir
            )
            sensor_data.append(sensor_entry)
            alerts.extend(frame_alerts)
            first_objects = objects
            first_lane_points = lane_points

            for alert in frame_alerts:
                total_alerts += 1
                if alert["type"] == "collision":
                    collision_count += 1
                elif alert["type"] == "lane_departure":
                    lane_departure_count += 1
                elif alert["type"] == "obstacle":
                    obstacle_count += 1
                elif alert["type"] == "traffic_sign":
                    traffic_sign_count += 1
        else:
            # Process video with batch processing
            cap = cv2.VideoCapture(filepath)
            if not cap.isOpened():
                logger.error(f"Cannot open video: {filepath}")
                raise ValueError("Cannot open video")

            frame_rate = cap.get(cv2.CAP_PROP_FPS) or 30
            frame_count = 0
            timestamp = datetime.datetime.now()
            frames = []
            prev_frame = None

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                frames.append(frame)
                
                if len(frames) >= 10 or not ret:  # Batch size 10
                    for i, frame in enumerate(frames):
                        if frame_count % int(frame_rate * FRAME_INTERVAL) == 0:
                            frame_time = timestamp + datetime.timedelta(seconds=frame_count / frame_rate)
                            sensor_entry, frame_alerts, objects, lane_points = process_image(
                                frame, vehicle_id, simulation_id, user_id, frame_time, frames_dir, prev_frame
                            )
                            sensor_data.append(sensor_entry)
                            alerts.extend(frame_alerts)
                            if frame_count == 0:
                                first_objects = objects
                                first_lane_points = lane_points

                            for alert in frame_alerts:
                                total_alerts += 1
                                if alert["type"] == "collision":
                                    collision_count += 1
                                elif alert["type"] == "lane_departure":
                                    lane_departure_count += 1
                                elif alert["type"] == "obstacle":
                                    obstacle_count += 1
                                elif alert["type"] == "traffic_sign":
                                    traffic_sign_count += 1

                        prev_frame = frame
                        frame_count += 1
                    frames = []

            cap.release()

        summary = {
            "totalAlerts": total_alerts,
            "collisionCount": collision_count,
            "laneDepartureCount": lane_departure_count,
            "obstacleCount": obstacle_count,
            "trafficSignCount": traffic_sign_count
        }

        return {
            "status": "completed",
            "summary": summary,
            "sensorData": sensor_data,
            "alerts": alerts
        }, first_objects, first_lane_points
    
    finally:
        # Không xóa frames_dir để giữ lại frame cho việc tạo video
        logger.info("Frames retained for video creation")