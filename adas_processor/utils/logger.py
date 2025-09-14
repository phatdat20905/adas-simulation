# utils/logger.py
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler

def get_logger(name="ADAS"):
    logger = logging.getLogger(name)
    if not logger.handlers:
        # Create logs directory
        log_dir = Path(__file__).parent.parent / "logs"
        log_dir.mkdir(exist_ok=True)
        
        # File handler với rotation
        file_handler = RotatingFileHandler(
            log_dir / "adas.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Formatter
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    
    return logger