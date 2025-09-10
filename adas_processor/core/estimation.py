# core/estimation.py
import math
from config.config import W_REAL_M

def focal_pixels(img_w, hfov_deg):
    return (img_w / 2.0) / math.tan(math.radians(hfov_deg / 2.0))

def est_distance_m(box, f_pix, cls=None):
    """
    box: (x1,y1,x2,y2)
    f_pix: focal length in pixels (precomputed by focal_pixels)
    cls: COCO class id (optional) to choose physical width
    """
    x1, y1, x2, y2 = box
    w_pix = max(1, (x2 - x1))
    Wm = W_REAL_M.get(cls, 1.8) if cls is not None else 1.8
    return (Wm * f_pix) / w_pix
