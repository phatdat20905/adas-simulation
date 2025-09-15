import torch
from pathlib import Path

# Base project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Model paths
YOLO_MODEL_PATH = str(BASE_DIR / "models" / "yolo11s.pt")
TRAFFIC_SIGN_MODEL_PATH = str(BASE_DIR / "models" / "best.pt")
POTHOLE_MODEL_PATH = str(BASE_DIR / "models" / "y8best.pt")  # NEW: Pothole model path

# Directories for syncing with NodeJS server
FRAMES_DIR = BASE_DIR.parent / "server" / "Processed" / "frames"
VIDEOS_DIR = BASE_DIR.parent / "server" / "Processed" / "videos"

# ADAS parameters
FRAME_INTERVAL = 0.5
ALERT_COOLDOWN_S = 5.0
DISTANCE_THRESHOLD_COLLISION = 5.0
DISTANCE_THRESHOLD_OBSTACLE = 10.0
LANE_DEPARTURE_THRESHOLD = 0.2
TRAFFIC_SIGN_CONFIDENCE_THRESHOLD = 0.7
OPTICAL_FLOW_SPEED_SCALE = 10.0

# NEW: Pedestrian detection parameters
PEDESTRIAN_DETECTION = True
PEDESTRIAN_WARNING_DISTANCE = 8.0  # mét
PEDESTRIAN_DANGER_DISTANCE = 3.0   # mét

# NEW: Pothole detection parameters  
POTHOLE_DETECTION = True  # Bật phát hiện ổ gà
POTHOLE_CONFIDENCE_THRESHOLD = 0.5
POTHOLE_WARNING_DISTANCE = 5.0  # mét

# NEW: Traffic light detection parameters
TRAFFIC_LIGHT_DETECTION = True
TRAFFIC_LIGHT_CONFIDENCE = 0.6  # Tăng confidence requirement
TRAFFIC_LIGHT_THRESHOLD = 500    # Tăng ngưỡng pixel

# Lane detection parameters
LANE_DETECTION_ENABLED = True
LANE_WARNING_COOLDOWN = 2.0

# Runtime options
SHOW_PREVIEW = True
SAVE_FRAMES = False
H_FOV_DEG = 78.0
DIST_WARN_M = 8.0
TTC_WARN_S = 3.0

# COCO mapping
COCO_NAMES = {
    0: "person", 1: "bicycle", 2: "car", 3: "motorcycle",
    5: "bus", 7: "truck", 9: "traffic light"
}
VEHICLES = {1, 2, 3, 5, 7}
PEDESTRIANS = {0}  # NEW: Class ID for pedestrians
W_REAL_M = {1: 0.6, 2: 1.8, 3: 0.7, 5: 2.5, 7: 2.5, 0: 0.5, 999: 0.8}  # NEW: Added pedestrian and pothole width

# NEW: Pothole classes
POTHOLE_CLASSES = {
    0: "pothole"
}

# NEW: Traffic light states
TRAFFIC_LIGHT_STATES = {
    "red": "DỪNG LẠI - ĐÈN ĐỎ",
    "yellow": "CHUẨN BỊ DỪNG - ĐÈN VÀNG", 
    "green": "ĐƯỢC PHÉP ĐI - ĐÈN XANH"
}

# Device selection
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"