# core/processing.py
import cv2
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from config.config import (
    FRAMES_DIR, VIDEOS_DIR, H_FOV_DEG,
    SAVE_FRAMES, SHOW_PREVIEW, DIST_WARN_M,
    ALERT_COOLDOWN_S, FRAME_INTERVAL, LANE_DEPARTURE_THRESHOLD
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
        self._last_alert_time = {}
        self._last_lane_alert_time = 0

    def _should_emit_alert(self, key: str, now: float, cooldown: float = ALERT_COOLDOWN_S) -> bool:
        last = self._last_alert_time.get(key)
        if last is None or (now - last) > cooldown:
            self._last_alert_time[key] = now
            return True
        return False

    def _should_emit_lane_alert(self, now: float, deviation: float) -> bool:
        if abs(deviation) > LANE_DEPARTURE_THRESHOLD:
            if now - self._last_lane_alert_time > ALERT_COOLDOWN_S:
                self._last_lane_alert_time = now
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

        current_lane_status = "within"
        current_lane_deviation = 0.0
        lane_warning_active = False

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Xử lý detection objects và lane
                vis, obj_data, obj_alerts = self.detector.detect_objects(
                    frame, W, f_pix, self.tracker, frame_idx, simulation_id
                )
                vis, sign_alerts = self.detector.detect_signs(vis)

                ts = current_timestamp()
                now = time.time()

                # Lấy thông tin làn đường
                if obj_data:
                    current_lane_deviation = obj_data[0].get("lane_deviation", 0.0)
                    current_lane_status = obj_data[0].get("lane_status", "within")

                # Chọn object gần nhất
                nearest_obj = None
                if obj_data:
                    objects_with_dist = [obj for obj in obj_data if obj.get("dist") is not None]
                    if objects_with_dist:
                        nearest_obj = min(objects_with_dist, key=lambda d: d.get("dist") or 1e9)
                    else:
                        nearest_obj = obj_data[0]

                # SensorData logging
                if nearest_obj and now - last_sensor_time >= FRAME_INTERVAL:
                    sensor_entry = {
                        "vehicleId": vehicle_id, "simulationId": simulation_id, "userId": user_id,
                        "timestamp": ts, "speed": float(nearest_obj.get("speed") or 0.0),
                        "distance_to_object": float(nearest_obj.get("dist") or 0.0),
                        "lane_status": current_lane_status, "lane_deviation": float(current_lane_deviation),
                        "obstacle_detected": bool(nearest_obj.get("obstacle_detected", False)),
                        "camera_frame_url": None, "track_id": nearest_obj.get("track_id"),
                        "frame_index": frame_idx, "ttc": nearest_obj.get("ttc"),
                        "warn": bool(nearest_obj.get("warn", False))
                    }
                    sensor_data.append(sensor_entry)
                    last_sensor_time = now

                # Alerts processing
                def emit_once(key: str, atype: str, desc: str, severity: str = "medium"):
                    if self._should_emit_alert(key, now):
                        alerts.append({
                            "type": atype, "description": desc, "severity": severity, "timestamp": ts
                        })

                # NEW: Process all types of alerts
                all_alerts = obj_alerts + sign_alerts
                for alert in all_alerts:
                    alert_type = alert["type"]
                    if alert_type in ["collision", "obstacle", "pedestrian_collision", 
                                    "pedestrian_warning", "road_hazard", "traffic_light", "traffic_sign"]:
                        emit_once(
                            f"{alert_type}_{alert.get('track_id', 'unknown')}_{frame_idx}",
                            alert_type,
                            alert["description"],
                            alert["severity"]
                        )

                # Lane departure alerts
                if self._should_emit_lane_alert(now, current_lane_deviation):
                    lane_warning_active = True
                    emit_once(
                        "lane_departure", "lane_departure", 
                        f"Lane departure detected (deviation: {current_lane_deviation:.3f})", "high"
                    )
                else:
                    lane_warning_active = False

                # Visualization
                if lane_warning_active:
                    cv2.putText(vis, "LANE DEPARTURE WARNING!", (50, H - 50),
                              cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
                    cv2.rectangle(vis, (30, H - 90), (W - 30, H - 20), (0, 0, 255), 3)

                deviation_color = (0, 255, 0) if abs(current_lane_deviation) <= LANE_DEPARTURE_THRESHOLD else (0, 0, 255)
                cv2.putText(vis, f"Lane Deviation: {current_lane_deviation:.3f}", (10, 30),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, deviation_color, 2)
                cv2.putText(vis, f"Lane Status: {current_lane_status}", (10, 60),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, deviation_color, 2)

                # Write video
                writer.write(vis)
                frame_idx += 1

                if SHOW_PREVIEW:
                    cv2.imshow("ADAS", vis)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break

                if frame_idx % 100 == 0:
                    logger.info(f"Processed frames: {frame_idx}, elapsed: {time.time() - t_start:.1f}s")

        except Exception as e:
            logger.error(f"Error during video processing: {e}")
            raise
        finally:
            cap.release()
            writer.release()
            if SHOW_PREVIEW:
                cv2.destroyAllWindows()

        # Convert video
        final_url = finalize_video(simulation_id, raw_out, output_path.parent)
        if not final_url:
            final_url = f"/Processed/videos/{raw_out.name}"

        # Create summary
        summary = self._create_summary(alerts)

        return {
            "status": "completed",
            "summary": summary,
            "sensorData": sensor_data,
            "alerts": alerts,
            "videoUrl": final_url
        }

    def _create_summary(self, alerts: List[Dict]) -> Dict:
        """Tạo summary từ alerts với các loại mới"""
        return {
            "totalAlerts": len(alerts),
            "collisionCount": sum(1 for a in alerts if a["type"] == "collision"),
            "pedestrianCollisionCount": sum(1 for a in alerts if a["type"] == "pedestrian_collision"),
            "pedestrianWarningCount": sum(1 for a in alerts if a["type"] == "pedestrian_warning"),
            "roadHazardCount": sum(1 for a in alerts if a["type"] == "road_hazard"),
            "trafficLightCount": sum(1 for a in alerts if a["type"] == "traffic_light"),
            "trafficSignCount": sum(1 for a in alerts if a["type"] == "traffic_sign"),
            "laneDepartureCount": sum(1 for a in alerts if a["type"] == "lane_departure"),
            "obstacleCount": sum(1 for a in alerts if a["type"] == "obstacle"),
        }

    def reset(self):
        """Reset processor state"""
        self.tracker = ObjectTracker()
        self._last_alert_time = {}
        self._last_lane_alert_time = 0
        logger.info("ADASProcessor reset complete")