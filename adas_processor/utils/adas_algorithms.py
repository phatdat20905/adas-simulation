import cv2
import numpy as np
from ultralytics import YOLO
from tensorflow.keras.models import load_model
import torch
from config.config import YOLO_MODEL_PATH, TRAFFIC_SIGN_MODEL_PATH, LANENET_MODEL_PATH, LANE_DEPARTURE_THRESHOLD, TRAFFIC_SIGN_CONFIDENCE_THRESHOLD, OPTICAL_FLOW_SPEED_SCALE
from utils.logger import setup_logger

logger = setup_logger()

# Load models with error handling
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
    logger.info(f"YOLO model loaded: {YOLO_MODEL_PATH}")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {str(e)}")
    raise Exception(f"YOLO model load failed: {str(e)}")

try:
    traffic_sign_model = load_model(TRAFFIC_SIGN_MODEL_PATH)
    logger.info(f"Traffic sign model loaded: {TRAFFIC_SIGN_MODEL_PATH}")
except Exception as e:
    logger.warning(f"Traffic sign model not loaded: {str(e)}. Using fallback.")
    traffic_sign_model = None

try:
    lane_model = torch.load(LANENET_MODEL_PATH, map_location=torch.device('cpu'))
    lane_model.eval()
    logger.info(f"LaneNet model loaded: {LANENET_MODEL_PATH}")
except Exception as e:
    logger.warning(f"LaneNet model not loaded: {str(e)}. Using Hough Transform fallback.")
    lane_model = None

# Mock traffic sign classes (replace with actual GTSRB classes)
traffic_sign_classes = ["stop_sign", "yield_sign", "speed_limit_50", "no_entry"]

def detect_lanes(frame):
    """Lane detection using LaneNet or Hough Transform fallback"""
    if lane_model is not None:
        try:
            img = cv2.resize(frame, (512, 256))
            img = torch.from_numpy(img).float().permute(2, 0, 1).unsqueeze(0) / 255.0
            with torch.no_grad():
                output = lane_model(img)
            lane_status = "within" if output[0].max() > LANE_DEPARTURE_THRESHOLD else "departing"
            logger.debug(f"LaneNet detected: {lane_status}")
            return lane_status, []
        except Exception as e:
            logger.error(f"LaneNet failed: {str(e)}. Falling back to Hough Transform.")
    
    # Hough Transform fallback
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
                if abs(x1 - x2) > frame.shape[1] * 0.1:
                    lane_status = "departing"
        logger.debug(f"Hough Transform detected: {lane_status}")
        return lane_status, lane_points
    except Exception as e:
        logger.error(f"Hough Transform failed: {str(e)}")
        return "within", []

def detect_obstacles(frame):
    """Obstacle detection using YOLOv8"""
    try:
        objects = []
        obstacle_detected = False
        min_distance = float("inf")
        
        results = yolo_model(frame)
        for result in results:
            for box in result.boxes:
                class_name = yolo_model.names[int(box.cls)]
                confidence = float(box.conf)
                bbox = box.xywh[0].tolist()  # [x, y, w, h]
                objects.append({"type": class_name, "bbox": bbox, "confidence": confidence})
                obstacle_detected = True
                distance = 1000 / bbox[3] if bbox[3] > 0 else float("inf")
                min_distance = min(min_distance, distance)
        
        logger.debug(f"Obstacles detected: {len(objects)}")
        return objects, obstacle_detected, min_distance
    except Exception as e:
        logger.error(f"Obstacle detection failed: {str(e)}")
        return [], False, float("inf")

def detect_traffic_signs(frame):
    """Traffic sign detection using MobileNetV2"""
    if traffic_sign_model is None:
        logger.debug("No traffic sign model available")
        return None
    try:
        img = cv2.resize(frame, (224, 224))
        img = img / 255.0
        pred = traffic_sign_model.predict(np.array([img]), verbose=0)
        class_idx = np.argmax(pred[0])
        confidence = pred[0][class_idx]
        if confidence > TRAFFIC_SIGN_CONFIDENCE_THRESHOLD:
            logger.debug(f"Traffic sign detected: {traffic_sign_classes[class_idx]}")
            return {"type": traffic_sign_classes[class_idx], "confidence": float(confidence)}
        return None
    except Exception as e:
        logger.error(f"Traffic sign detection failed: {str(e)}")
        return None

def estimate_speed(prev_frame, curr_frame):
    """Estimate speed using optical flow"""
    if prev_frame is None or curr_frame is None:
        logger.debug("Mock speed used: 40 km/h")
        return 40.0
    try:
        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(curr_frame, cv2.COLOR_BGR2GRAY)
        flow = cv2.calcOpticalFlowFarneback(prev_gray, curr_gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        magnitude, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        speed = np.mean(magnitude) * OPTICAL_FLOW_SPEED_SCALE
        logger.debug(f"Estimated speed: {speed:.2f} km/h")
        return speed
    except Exception as e:
        logger.error(f"Speed estimation failed: {str(e)}")
        return 40.0