from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Model paths
YOLO_MODEL_PATH = str(BASE_DIR / "models" / "yolov8n.pt")
TRAFFIC_SIGN_MODEL_PATH = str(BASE_DIR / "models" / "traffic_sign_model.h5")
LANENET_MODEL_PATH = str(BASE_DIR / "models" / "lanenet_model.pth")

# Frames directory (đồng bộ với backend Node.js)
FRAMES_DIR = str(BASE_DIR.parent / "src" / "Uploads" / "frames")

# ADAS parameters
FRAME_INTERVAL = 0.5  # Save sensor data every 0.5s
DISTANCE_THRESHOLD_COLLISION = 5.0  # meters
DISTANCE_THRESHOLD_OBSTACLE = 10.0  # meters
LANE_DEPARTURE_THRESHOLD = 0.5  # LaneNet confidence
TRAFFIC_SIGN_CONFIDENCE_THRESHOLD = 0.7
OPTICAL_FLOW_SPEED_SCALE = 10.0  # Scale for speed estimation (km/h)