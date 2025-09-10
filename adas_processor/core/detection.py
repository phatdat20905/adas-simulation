from ultralytics import YOLO
import cv2
from config.config import COCO_NAMES, VEHICLES, DIST_WARN_M, SAVE_FRAMES, FRAMES_DIR
from .estimation import est_distance_m
from pathlib import Path

FRAMES_DIR = Path(FRAMES_DIR)
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

class Detector:
    def __init__(self, coco_model_path, sign_model_path, device="cpu"):
        self.model_coco = YOLO(str(coco_model_path))
        self.model_sign = YOLO(str(sign_model_path))
        self.device = device

    def detect_objects(self, frame, W, f_pix, tracker, frame_idx=None, simulation_id=None):
        results = self.model_coco.track(
            frame, imgsz=1280, conf=0.35,
            device=self.device, persist=True,
            tracker="bytetrack.yaml", verbose=False
        )

        data, alerts = [], []
        res = results[0]

        if getattr(res, "boxes", None) is None:
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
            lane_status = "within"

            if cls in VEHICLES and track_id != -1:
                dist = est_distance_m((x1, y1, x2, y2), f_pix, cls)
                speed_kmh, v_rel = tracker.estimate_speed(track_id, dist)

                if v_rel is not None and v_rel > 0.1:  # approaching
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
                "cls": cls,
                "name": name,
                "dist": dist,
                "speed": speed_kmh,
                "ttc": ttc,
                "obstacle_detected": obstacle_detected,
                "lane_status": lane_status,
                "bbox": [x1, y1, x2, y2],
                "track_id": track_id,
                "warn": bool(warn)
            })

        return frame, data, alerts

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
