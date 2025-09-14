# service/video_utils.py
from pathlib import Path
import os
import subprocess
from utils.logger import get_logger

logger = get_logger("video_utils")

def finalize_video(simulation_id: str, tmp_video: Path, output_dir: Path):
    """
    Nhận video tạm (mp4v) từ OpenCV, convert sang H.264 để phát frontend.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    final_video = output_dir / f"simulation_{simulation_id}.mp4"

    if not tmp_video.exists():
        logger.error(f"Tmp video {tmp_video} not found!")
        return None

    # Kiểm tra hardware acceleration
    hw_accel = ""
    try:
        if cv2.cuda.getCudaEnabledDeviceCount() > 0:
            hw_accel = "-hwaccel cuda -hwaccel_output_format cuda"
            codec = "h264_nvenc"
        else:
            codec = "libx264"
    except:
        codec = "libx264"

    try:
        cmd = [
            "ffmpeg", "-y",
            *hw_accel.split(),
            "-i", str(tmp_video),
            "-vcodec", codec,
            "-preset", "fast",
            "-crf", "23",
            "-acodec", "aac",
            "-movflags", "+faststart",
            str(final_video)
        ]
        
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        logger.info(f"Converted to {final_video}")

        # Xóa file tmp
        try:
            os.remove(tmp_video)
        except Exception as e:
            logger.warning(f"Could not delete tmp video: {e}")

        return f"/Processed/videos/simulation_{simulation_id}.mp4"

    except subprocess.CalledProcessError as e:
        logger.error(f"ffmpeg conversion failed: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in finalize_video: {e}")
        return None