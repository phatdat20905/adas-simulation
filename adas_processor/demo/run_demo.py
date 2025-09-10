import sys
from pathlib import Path
from config.config import YOLO_MODEL_PATH, TRAFFIC_SIGN_MODEL_PATH, VIDEOS_DIR, DEVICE
from core.processing import ADASProcessor

def main(video_path):
    output = VIDEOS_DIR / "demo_output.mp4"
    processor = ADASProcessor(YOLO_MODEL_PATH, TRAFFIC_SIGN_MODEL_PATH, DEVICE)
    result = processor.run(video_path, output, "demo123", "veh001", "user001")
    print("✅ Demo completed")
    print("Summary:", result["summary"])
    print("Video saved at:", output)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m demo.run_demo <video_path>")
    else:
        main(sys.argv[1])
