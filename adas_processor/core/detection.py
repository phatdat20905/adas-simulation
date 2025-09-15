# core/detection.py
from ultralytics import YOLO
import cv2
import numpy as np
from config.config import (
    COCO_NAMES, VEHICLES, PEDESTRIANS, DIST_WARN_M, 
    PEDESTRIAN_WARNING_DISTANCE, PEDESTRIAN_DANGER_DISTANCE,
    POTHOLE_DETECTION, TRAFFIC_LIGHT_DETECTION, TRAFFIC_LIGHT_CONFIDENCE,
    TRAFFIC_LIGHT_STATES, LANE_DEPARTURE_THRESHOLD, FRAMES_DIR, 
    POTHOLE_CONFIDENCE_THRESHOLD, POTHOLE_MODEL_PATH, POTHOLE_CLASSES,
    POTHOLE_WARNING_DISTANCE  # NEW
)
from .estimation import est_distance_m
from .lane_detection import LaneDepartureWarning
from pathlib import Path

FRAMES_DIR = Path(FRAMES_DIR)
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

class Detector:
    def __init__(self, coco_model_path, sign_model_path, device="cpu"):
        self.model_coco = YOLO(str(coco_model_path))
        self.model_sign = YOLO(str(sign_model_path))
        self.model_pothole = YOLO(str(POTHOLE_MODEL_PATH))  # NEW: Pothole model
        self.device = device
        self.lane_detector = LaneDepartureWarning(warning_threshold=LANE_DEPARTURE_THRESHOLD)

    def detect_objects(self, frame, W, f_pix, tracker, frame_idx=None, simulation_id=None):
        results = self.model_coco.track(
            frame, imgsz=1280, conf=0.35,
            device=self.device, persist=True,
            tracker="bytetrack.yaml", verbose=False
        )

        data, alerts = [], []
        res = results[0]

        # Detect lane departure
        lane_warning, lane_deviation, _ = self.lane_detector.process_frame(frame, draw=False)
        
        # Thêm cảnh báo lane departure nếu cần
        if lane_warning:
            alerts.append({
                "type": "lane_departure",
                "description": f"Lane departure detected (deviation: {lane_deviation:.3f})",
                "severity": "high"
            })

        # NEW: Detect potholes với YOLOv8
        if POTHOLE_DETECTION:
            pothole_alerts = self._detect_potholes_yolo(frame, f_pix)
            alerts.extend(pothole_alerts)

        # NEW: Detect traffic lights
        if TRAFFIC_LIGHT_DETECTION:
            traffic_light_alerts = self._detect_traffic_lights(frame)
            alerts.extend(traffic_light_alerts)

        if getattr(res, "boxes", None) is None:
            if lane_deviation is not None:
                data.append({
                    "cls": -1, "name": "lane", "dist": None, "speed": None, "ttc": None,
                    "obstacle_detected": False, "lane_status": "departing" if abs(lane_deviation) > LANE_DEPARTURE_THRESHOLD else "within",
                    "lane_deviation": lane_deviation, "bbox": None, "track_id": -1, "warn": lane_warning
                })
            return frame, data, alerts

        for b in res.boxes:
            try:
                cls = int(b.cls[0])
            except Exception:
                cls = int(b.cls) if hasattr(b, "cls") else None
            if cls is None or cls not in COCO_NAMES:
                continue

            xyxy = b.xyxy[0].tolist()
            x1, y1, x2, y2 = map(int, xyxy)

            track_id = -1
            if hasattr(b, "id") and b.id is not None:
                try:
                    track_id = int(b.id[0])
                except Exception:
                    try:
                        track_id = int(b.id)
                    except Exception:
                        track_id = -1

            name = COCO_NAMES[cls]
            dist, speed_kmh, v_rel, ttc, warn = None, None, None, None, False
            obstacle_detected = False
            
            # Xác định trạng thái làn đường
            lane_status = "within"
            if lane_deviation is not None:
                if abs(lane_deviation) > LANE_DEPARTURE_THRESHOLD:
                    lane_status = "departing"
                elif abs(lane_deviation) > LANE_DEPARTURE_THRESHOLD * 0.7:
                    lane_status = "warning"
                else:
                    lane_status = "within"

            # NEW: Pedestrian detection and warning
            if cls in PEDESTRIANS:
                dist = est_distance_m((x1, y1, x2, y2), f_pix, cls)
                
                if dist is not None and dist < PEDESTRIAN_DANGER_DISTANCE:
                    warn = True
                    alerts.append({
                        "type": "pedestrian_collision",
                        "description": f"NGƯỜI ĐI BỘ quá gần ({dist:.1f}m)",
                        "severity": "high",
                        "track_id": track_id
                    })
                elif dist is not None and dist < PEDESTRIAN_WARNING_DISTANCE:
                    alerts.append({
                        "type": "pedestrian_warning",
                        "description": f"Người đi bộ phía trước ({dist:.1f}m)",
                        "severity": "medium",
                        "track_id": track_id
                    })

            # Vehicle detection (existing code)
            if cls in VEHICLES and track_id != -1:
                dist = est_distance_m((x1, y1, x2, y2), f_pix, cls)
                speed_kmh, v_rel = tracker.estimate_speed(track_id, dist)

                if v_rel is not None and v_rel > 0.1:
                    ttc = dist / v_rel

                if dist is not None and dist < DIST_WARN_M:
                    warn = True
                    obstacle_detected = True
                    alerts.append({
                        "type": "collision",
                        "description": f"{name} too close ({dist:.1f}m)",
                        "severity": "high",
                        "track_id": track_id
                    })
                elif dist is not None and dist < DIST_WARN_M * 1.5:
                    alerts.append({
                        "type": "obstacle",
                        "description": f"{name} detected at {dist:.1f}m",
                        "severity": "low",
                        "track_id": track_id
                    })

            # Draw bounding box
            color = (0, 0, 255) if warn else (0, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            label = f"{name}"
            if dist is not None:
                label += f" {dist:.2f}m"
            if speed_kmh is not None:
                label += f" {speed_kmh:+.1f}km/h"
            if ttc is not None:
                label += f" TTC:{ttc:.1f}s"
            if warn:
                label += " WARN"
                
            cv2.putText(frame, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            data.append({
                "cls": cls, "name": name, "dist": dist, "speed": speed_kmh, "ttc": ttc,
                "obstacle_detected": obstacle_detected, "lane_status": lane_status,
                "lane_deviation": lane_deviation, "bbox": [x1, y1, x2, y2],
                "track_id": track_id, "warn": bool(warn)
            })

        # Add lane information if no objects
        if not data and lane_deviation is not None:
            data.append({
                "cls": -1, "name": "lane", "dist": None, "speed": None, "ttc": None,
                "obstacle_detected": False, "lane_status": "departing" if abs(lane_deviation) > LANE_DEPARTURE_THRESHOLD else "within",
                "lane_deviation": lane_deviation, "bbox": None, "track_id": -1, "warn": lane_warning
            })

        return frame, data, alerts

    def _detect_potholes_yolo(self, frame, f_pix):
        """Phát hiện ổ gà sử dụng YOLOv8 model"""
        alerts = []
        try:
            # Chạy inference với model ổ gà
            results = self.model_pothole.predict(
                frame, imgsz=640, conf=POTHOLE_CONFIDENCE_THRESHOLD, 
                device=self.device, verbose=False
            )
            
            res = results[0]
            if getattr(res, "boxes", None) is not None:
                for b in res.boxes:
                    cls = int(b.cls[0]) if hasattr(b, "cls") else int(b.cls)
                    conf = float(b.conf[0]) if hasattr(b, "conf") else float(b.conf)
                    x1, y1, x2, y2 = map(int, b.xyxy[0].tolist())
                    
                    # Ước tính khoảng cách (sử dụng class 999 cho ổ gà)
                    dist = est_distance_m((x1, y1, x2, y2), f_pix, cls=999)
                    
                    # Lấy tên class
                    name = POTHOLE_CLASSES.get(cls, f"pothole{cls}")
                    
                    # Vẽ bounding box
                    color = (0, 0, 255) if dist is not None and dist < POTHOLE_WARNING_DISTANCE else (0, 165, 255)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    
                    label = f"{name} {conf:.2f}"
                    if dist is not None:
                        label += f" {dist:.1f}m"
                    
                    cv2.putText(frame, label, (x1, y1 - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                    
                    # Tạo cảnh báo nếu ổ gà gần
                    if dist is not None and dist < POTHOLE_WARNING_DISTANCE:
                        alerts.append({
                            "type": "road_hazard",
                            "description": f"Ổ gà nguy hiểm phía trước ({dist:.1f}m)",
                            "severity": "high",
                            "confidence": conf,
                            "distance": dist
                        })
                    elif dist is not None:
                        alerts.append({
                            "type": "road_hazard",
                            "description": f"Ổ gà phía trước ({dist:.1f}m)",
                            "severity": "medium",
                            "confidence": conf,
                            "distance": dist
                        })
                        
        except Exception as e:
            print(f"Pothole detection error: {e}")
        return alerts

    def _detect_traffic_lights(self, frame):
        """Nhận diện trạng thái đèn giao thông"""
        alerts = []
        try:
            # Convert to HSV color space
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            
            # Define color ranges
            red_lower1 = np.array([0, 100, 100])
            red_upper1 = np.array([10, 255, 255])
            red_lower2 = np.array([170, 100, 100])
            red_upper2 = np.array([180, 255, 255])
            
            green_lower = np.array([40, 100, 100])
            green_upper = np.array([80, 255, 255])
            
            yellow_lower = np.array([20, 100, 100])
            yellow_upper = np.array([30, 255, 255])
            
            # Create masks
            red_mask1 = cv2.inRange(hsv, red_lower1, red_upper1)
            red_mask2 = cv2.inRange(hsv, red_lower2, red_upper2)
            red_mask = cv2.bitwise_or(red_mask1, red_mask2)
            
            green_mask = cv2.inRange(hsv, green_lower, green_upper)
            yellow_mask = cv2.inRange(hsv, yellow_lower, yellow_upper)
            
            # Count pixels
            red_pixels = cv2.countNonZero(red_mask)
            green_pixels = cv2.countNonZero(green_mask)
            yellow_pixels = cv2.countNonZero(yellow_mask)
            
            # Threshold for detection
            threshold = 300
            
            if red_pixels > threshold and red_pixels > green_pixels and red_pixels > yellow_pixels:
                alerts.append({
                    "type": "traffic_light",
                    "description": TRAFFIC_LIGHT_STATES["red"],
                    "severity": "high"
                })
            elif green_pixels > threshold and green_pixels > red_pixels and green_pixels > yellow_pixels:
                alerts.append({
                    "type": "traffic_light",
                    "description": TRAFFIC_LIGHT_STATES["green"],
                    "severity": "low"
                })
            elif yellow_pixels > threshold and yellow_pixels > red_pixels and yellow_pixels > green_pixels:
                alerts.append({
                    "type": "traffic_light",
                    "description": TRAFFIC_LIGHT_STATES["yellow"],
                    "severity": "medium"
                })
                
        except Exception as e:
            print(f"Traffic light detection error: {e}")
        return alerts

    def detect_signs(self, frame):
        results = self.model_sign.predict(frame, imgsz=640, conf=0.4, device=self.device, verbose=False)
        alerts = []
        res = results[0]
        if getattr(res, "boxes", None) is not None:
            for b in res.boxes:
                cls = int(b.cls[0]) if hasattr(b, "cls") else int(b.cls)
                conf = float(b.conf[0]) if hasattr(b, "conf") else float(b.conf)
                x1, y1, x2, y2 = map(int, b.xyxy[0].tolist())
                name = self.model_sign.names.get(cls, f"sign{cls}") if hasattr(self.model_sign, "names") else f"sign{cls}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 165, 0), 2)
                cv2.putText(frame, f"{name} {conf:.2f}", (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)

                alerts.append({
                    "type": "traffic_sign",
                    "description": f"Detected sign: {name}",
                    "severity": "medium"
                })
        return frame, alerts