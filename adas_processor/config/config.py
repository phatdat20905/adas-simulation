import torch
from pathlib import Path

# Base project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Model paths
YOLO_MODEL_PATH = str(BASE_DIR / "models" / "yolo11s.pt")
TRAFFIC_SIGN_MODEL_PATH = str(BASE_DIR / "models" / "best.pt")

# Directories for syncing with NodeJS server
FRAMES_DIR = BASE_DIR.parent / "server" / "Processed" / "frames"
VIDEOS_DIR = BASE_DIR.parent / "server" / "Processed" / "videos"

# ADAS parameters
FRAME_INTERVAL = 0.5       # log sensorData mỗi 0.5s
ALERT_COOLDOWN_S = 5.0     # cooldown 5s cho cùng loại alert
DISTANCE_THRESHOLD_COLLISION = 5.0      # m
DISTANCE_THRESHOLD_OBSTACLE = 10.0      # m
LANE_DEPARTURE_THRESHOLD = 0.5          # lane offset threshold
TRAFFIC_SIGN_CONFIDENCE_THRESHOLD = 0.7
OPTICAL_FLOW_SPEED_SCALE = 10.0

# Runtime options
SHOW_PREVIEW = False   # default off for headless server
SAVE_FRAMES = False    # disable saving frames unless needed
H_FOV_DEG = 78.0
DIST_WARN_M = 8.0
TTC_WARN_S = 3.0

# COCO mapping
COCO_NAMES = {
    0: "person", 1: "bicycle", 2: "car", 3: "motorcycle",
    5: "bus", 7: "truck", 9: "traffic light"
}
VEHICLES = {1, 2, 3, 5, 7}
W_REAL_M = {1: 0.6, 2: 1.8, 3: 0.7, 5: 2.5, 7: 2.5}

# Device selection
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
