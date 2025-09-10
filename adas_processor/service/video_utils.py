from pathlib import Path
import os, subprocess
from utils.logger import get_logger

logger = get_logger("video_utils")

def finalize_video(simulation_id: str, tmp_video: Path, output_dir: Path):
    """
    Nhận video tạm (mp4v) từ OpenCV, convert sang H.264 để phát frontend.
    
    Args:
        simulation_id (str): id của simulation
        tmp_video (Path): file video tạm (ví dụ adas_combined.mp4)
        output_dir (Path): thư mục lưu video final

    Returns:
        str | None: đường dẫn web tới video final hoặc None nếu lỗi
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    final_video = output_dir / f"simulation_{simulation_id}.mp4"

    if not tmp_video.exists():
        logger.error(f"Tmp video {tmp_video} not found!")
        return None

    # convert sang H.264 MP4 bằng ffmpeg
    try:
        cmd = [
            "ffmpeg", "-y",
            "-i", str(tmp_video),
            "-vcodec", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-acodec", "aac",
            "-movflags", "+faststart",
            str(final_video)
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info(f"✅ Converted to {final_video}")

        # Xóa file tmp sau khi convert thành công
        try:
            os.remove(tmp_video)
        except Exception as e:
            logger.warning(f"Không xóa được tmp video: {e}")

        # Trả về path để frontend load
        return f"/Processed/videos/simulation_{simulation_id}.mp4"

    except subprocess.CalledProcessError as e:
        logger.error(f"ffmpeg conversion failed: {e.stderr.decode(errors='ignore')}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in finalize_video: {e}")
        return None
