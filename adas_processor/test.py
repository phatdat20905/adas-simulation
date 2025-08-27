import cv2, math, time, subprocess
from ultralytics import YOLO

# =======================
# Cấu hình
# =======================
VIDEO = "1755402096149-demo.mp4"   # hoặc 0 cho webcam
MODEL_COCO = "yolo11s.pt"          # YOLOv11 pretrained (COCO)
MODEL_SIGN = "models/best.pt"      # YOLO model đã train biển báo VN
SAVE_OUT = "adas_combined.mp4"
SAVE_FINAL = "adas_final.mp4"      # file convert chuẩn web
DEVICE = 'cpu'

DIST_WARN_M = 8.0
H_FOV_DEG = 78.0

# Các class COCO cần dùng
COCO_NAMES = {
    0:"person",1:"bicycle",2:"car",3:"motorcycle",
    5:"bus",7:"truck",9:"traffic light"
}
VEHICLES = {1,2,3,5,7}  # bicycle, car, motorcycle, bus, truck

# Bề ngang thực tế (m)
W_REAL_M = {1:0.6,2:1.8,3:0.7,5:2.5,7:2.5}

# =======================
# Hàm tiện ích
# =======================
def focal_pixels(img_w, hfov_deg):
    return (img_w/2.0)/math.tan(math.radians(hfov_deg/2.0))

def est_distance_m(box, img_w, f_pix, cls):
    x1,y1,x2,y2 = box
    w_pix = max(1,(x2-x1))
    Wm = W_REAL_M.get(cls,1.8)
    return (Wm*f_pix)/w_pix

def draw_label(im, txt, x, y, color=(0,255,0)):
    cv2.putText(im, txt, (x,y-5), 0, 0.6, color, 2)

# =======================
# Khởi tạo models
# =======================
model_coco = YOLO(MODEL_COCO)
model_sign = YOLO(MODEL_SIGN)

cap = cv2.VideoCapture(VIDEO)
fps = cap.get(cv2.CAP_PROP_FPS)
if fps == 0 or fps is None:
    fps = 30.0
W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
if W == 0 or H == 0:
    raise ValueError("Không đọc được kích thước video đầu vào!")

f_pix = focal_pixels(W, H_FOV_DEG)
writer = cv2.VideoWriter(SAVE_OUT, cv2.VideoWriter_fourcc(*"mp4v"), fps, (W,H))

last_distances = {}

# =======================
# Loop
# =======================
while True:
    ret, frame = cap.read()
    if not ret: break
    t0 = time.time()
    vis = frame.copy()

    # ---- 1. Phát hiện & theo dõi bằng YOLO COCO ----
    results = model_coco.track(frame, imgsz=1280, conf=0.35, device=DEVICE,
                               persist=True, tracker="bytetrack.yaml", verbose=False)
    res = results[0]

    if res.boxes is not None:
        for b in res.boxes:
            cls = int(b.cls[0])
            if cls not in COCO_NAMES: continue
            name = COCO_NAMES[cls]
            conf = float(b.conf[0])
            x1,y1,x2,y2 = map(int, b.xyxy[0].tolist())
            track_id = int(b.id[0]) if b.id is not None else -1

            color = (0,255,0)
            label = f"{name} {conf:.2f}"

            # Nếu là phương tiện -> ước lượng khoảng cách + tốc độ
            if cls in VEHICLES and track_id != -1:
                dist = est_distance_m((x1,y1,x2,y2), W, f_pix, cls)

                speed_kmh = None
                if track_id in last_distances:
                    prev_dist, prev_t = last_distances[track_id]
                    dt = time.time() - prev_t
                    if dt > 1e-3:
                        v_rel = (prev_dist - dist) / dt   # m/s
                        speed_kmh = v_rel * 3.6           # km/h
                last_distances[track_id] = (dist, time.time())

                label += f" {dist:.1f}m"
                if speed_kmh is not None:
                    label += f" {speed_kmh:+.1f}km/h"

                if dist < DIST_WARN_M:
                    color = (0,0,255)
                    label += " WARN"

            cv2.rectangle(vis, (x1,y1), (x2,y2), color, 2)
            draw_label(vis, label, x1, y1, color)

    # ---- 2. Nhận diện biển báo ----
    results_sign = model_sign.predict(frame, imgsz=640, conf=0.4, device=DEVICE, verbose=False)
    res_sign = results_sign[0]

    if res_sign.boxes is not None:
        for b in res_sign.boxes:
            cls = int(b.cls[0])
            conf = float(b.conf[0])
            x1,y1,x2,y2 = map(int, b.xyxy[0].tolist())

            name = model_sign.names[cls] if hasattr(model_sign, "names") else f"sign{cls}"
            label = f"{name} {conf:.2f}"

            cv2.rectangle(vis, (x1,y1), (x2,y2), (255,165,0), 2)
            draw_label(vis, label, x1, y1, (255,165,0))

    # ---- Thông tin FPS ----
    fps_now = 1.0 / max(1e-3, (time.time()-t0))
    cv2.putText(vis, f"FPS:{fps_now:.1f}", (15,30), 0, 0.8, (255,255,255), 2)

    writer.write(vis)
    cv2.imshow("ADAS Combined", vis)
    if cv2.waitKey(1) & 0xFF==ord('q'): break

cap.release(); writer.release(); cv2.destroyAllWindows()
print("Saved raw video:", SAVE_OUT)

# =======================
# Convert sang H.264
# =======================
try:
    cmd = ["ffmpeg", "-y", "-i", SAVE_OUT, "-vcodec", "libx264", "-acodec", "aac", SAVE_FINAL]
    subprocess.run(cmd, check=True)
    print("✅ Converted to:", SAVE_FINAL)
except Exception as e:
    print("⚠️ Lỗi khi convert video:", e)
