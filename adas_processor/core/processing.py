# core/processing.py
import cv2
import time
from pathlib import Path
from typing import Any, Dict, List
from config.config import (
    FRAMES_DIR, VIDEOS_DIR, H_FOV_DEG,
    SAVE_FRAMES, SHOW_PREVIEW, DIST_WARN_M,
    ALERT_COOLDOWN_S, FRAME_INTERVAL
)
from .tracking import ObjectTracker
from .detection import Detector
from .estimation import focal_pixels
from utils.helpers import current_timestamp
from utils.logger import get_logger
from service.video_utils import finalize_video

logger = get_logger("ADASProcessor")

FRAMES_DIR = Path(FRAMES_DIR); FRAMES_DIR.mkdir(parents=True, exist_ok=True)
VIDEOS_DIR = Path(VIDEOS_DIR); VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

class ADASProcessor:
    def __init__(self, coco_model: str, sign_model: str, device: str = "cpu"):
        self.detector = Detector(coco_model, sign_model, device)
        self.tracker = ObjectTracker()
        self.device = device
        self._last_alert_time = {}  # key = (alert_type or (track_id, type)) -> timestamp

    def _should_emit_alert(self, key, now, cooldown=ALERT_COOLDOWN_S) -> bool:
        last = self._last_alert_time.get(key)
        if last is None or (now - last) > cooldown:
            self._last_alert_time[key] = now
            return True
        return False

    def run(self, video_path: str, output_path: Any, simulation_id: str,
            vehicle_id: str, user_id: str) -> Dict:
        output_path = Path(output_path)
        raw_out = output_path.with_name(output_path.stem + "_raw.mp4")

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
        H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
        f_pix = focal_pixels(W, H_FOV_DEG)

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(str(raw_out), fourcc, fps, (W, H))
        if not writer.isOpened():
            raise RuntimeError(f"Cannot open video writer: {raw_out}")

        sensor_data: List[Dict] = []
        alerts: List[Dict] = []
        frame_idx = 0
        t_start = time.time()
        last_sensor_time = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                vis, obj_data, obj_alerts = self.detector.detect_objects(
                    frame, W, f_pix, self.tracker, frame_idx, simulation_id
                )
                vis, sign_alerts = self.detector.detect_signs(vis)

                ts = current_timestamp()
                now = time.time()

                # --- chọn object gần nhất ---
                nearest_obj = None
                if obj_data:
                    nearest_obj = min(obj_data, key=lambda d: d.get("dist") or 1e9)

                # --- SensorData chỉ log mỗi FRAME_INTERVAL ---
                if nearest_obj and now - last_sensor_time >= FRAME_INTERVAL:
                    sensor_entry = {
                        "vehicleId": vehicle_id,
                        "simulationId": simulation_id,
                        "userId": user_id,
                        "timestamp": ts,
                        "speed": float(nearest_obj.get("speed") or 0.0),
                        "distance_to_object": float(nearest_obj.get("dist") or 0.0),
                        "lane_status": nearest_obj.get("lane_status", "within"),
                        "obstacle_detected": bool(nearest_obj.get("obstacle_detected")),
                        "camera_frame_url": None,
                        "track_id": nearest_obj.get("track_id"),
                        "frame_index": frame_idx,
                        "ttc": nearest_obj.get("ttc"),
                        "warn": bool(nearest_obj.get("warn"))
                    }
                    sensor_data.append(sensor_entry)
                    last_sensor_time = now

                # --- Alerts (tổng hợp + cooldown) ---
                def emit_once(key, atype, desc, severity="medium"):
                    if self._should_emit_alert(key, now):
                        alerts.append({
                            "type": atype,
                            "description": desc,
                            "severity": severity,
                            "timestamp": ts
                        })

                if any(a["type"] == "collision" for a in obj_alerts):
                    emit_once("collision", "collision", "Collision risk detected", "high")
                if any(a["type"] == "lane_departure" for a in obj_alerts):
                    emit_once("lane_departure", "lane_departure", "Lane departure detected", "high")
                if any(a["type"] == "obstacle" for a in obj_alerts):
                    emit_once("obstacle", "obstacle", "Obstacle detected ahead", "low")
                for a in sign_alerts:
                    emit_once(f"sign_{a['description']}", "traffic_sign", a["description"], "medium")

                # --- Ghi video ---
                writer.write(vis)
                frame_idx += 1

                if SHOW_PREVIEW:
                    cv2.imshow("ADAS", vis)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break

                if frame_idx % 100 == 0:
                    logger.info(f"Processed frames: {frame_idx}, elapsed: {time.time() - t_start:.1f}s")

        finally:
            cap.release()
            writer.release()
            if SHOW_PREVIEW:
                cv2.destroyAllWindows()

        # convert raw -> h264 final file (dùng video_utils)
        final_url = finalize_video(simulation_id, raw_out, output_path.parent)
        if not final_url:
            final_url = f"/Processed/videos/{raw_out.name}"

        summary = {
            "totalAlerts": len(alerts),
            "collisionCount": sum(1 for a in alerts if a["type"] == "collision"),
            "trafficSignCount": sum(1 for a in alerts if a["type"] == "traffic_sign"),
            "laneDepartureCount": sum(1 for a in alerts if a["type"] == "lane_departure"),
            "obstacleCount": sum(1 for a in alerts if a["type"] == "obstacle"),
        }

        return {
            "status": "completed",
            "summary": summary,
            "sensorData": sensor_data,
            "alerts": alerts,
            "videoUrl": final_url
        }
