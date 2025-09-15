# 🏍️ ADAS Simulation App – Advanced Driver Assistance System for Motorcycles  

## 📌 Giới thiệu  
Ứng dụng **ADAS Simulation App** cho phép người dùng **tải lên video giao thông** và hệ thống sẽ phân tích bằng **AI (YOLOv8 + OpenCV)** để phát hiện:  
- 🚧 **Chướng ngại vật**  
- 💥 **Nguy cơ va chạm (Collision risk)**  
- 🚦 **Biển báo giao thông (Traffic sign)**  

Hệ thống mô phỏng **cảm biến ADAS** như trên phương tiện thực, sinh dữ liệu **Sensor Data** và **Cảnh báo (Alerts)** để người dùng dễ dàng quan sát và nghiên cứu.  

---

## ✨ Tính năng chính  
- 👤 **Quản lý người dùng** (JWT Authentication, phân quyền User/Admin).  
- 🚘 **Quản lý phương tiện** (CRUD).  
- 🎥 **Upload video mô phỏng**.  
- 🤖 **Phân tích video bằng AI**:  
  - Nhận diện xe, người đi bộ.  
  - Ước tính khoảng cách, tốc độ, TTC (time-to-collision).  
  - Sinh cảnh báo: collision, obstacle, traffic sign.  
- 📊 **Dashboard kết quả**: hiển thị video đầu ra, sensor data, alert log.  
- 🗄️ **Quản trị hệ thống**: quản lý toàn bộ user, phương tiện, mô phỏng.  

---

## 🏗️ Kiến trúc hệ thống  
- **Frontend (React + TypeScript + Tailwind)**: giao diện người dùng.  
- **Backend (Node.js + Express + MongoDB)**: API, quản lý user/vehicle/simulation.  
- **ADAS Processor (Python + OpenCV + YOLOv8)**: phân tích video.  
- **Database (MongoDB Atlas / Local)**: lưu user, vehicle, simulation, sensor data, alerts.  

**Luồng xử lý:**  
1. Người dùng upload video.  
2. Backend lưu video → gọi Python Processor.  
3. Python phân tích video → sinh dữ liệu + video đầu ra.  
4. Backend lưu dữ liệu vào MongoDB.  
5. Frontend hiển thị kết quả.  

---

## ⚙️ Cài đặt  

### 1️⃣ Yêu cầu môi trường  
- Node.js >= 18  
- Python >= 3.10  
- MongoDB >= 6.0  
- ffmpeg (để convert video)  
- GPU (khuyến nghị, nhưng có thể chạy CPU)  

### 2️⃣ Clone dự án  
```bash
git clone https://github.com/your-username/adas-simulation-app.git
cd adas-simulation-app
```

### 3️⃣ Cài đặt Backend (Node.js)  
```bash
cd server
npm install
```

Tạo file `.env`:  
```env
PORT=5000
MONGO_URI=
PYTHON_API_URL=http://localhost:5001/process
JWT_SECRET=c5348090-8829-4e76-8d8a-db010cf22eaa
REFRESH_TOKEN_SECRET=ff782a64-1712-49de-8c0d-35e108f12e1f
ADMIN_EMAIL=
ADMIN_PASSWORD=

```

Chạy server:  
```bash
npm run dev
```

### 4️⃣ Cài đặt Python Service (ADAS Processor)  
```bash
cd adas_processor
pip install -r requirements.txt
```

#### 🔗 Tải model YOLO
Vì file model quá lớn (>100 MB) không thể đẩy trực tiếp lên GitHub, bạn cần **tải model YOLO đã huấn luyện** từ Google Drive:  
👉 [Tải model tại đây](https://drive.google.com/file/d/1eZ1PvV-tJeKXw4GZk6F1vVUIAFMo2oFb/view?usp=sharing)  

Sau khi tải xong, hãy đặt file **`y8best.pt`** vào thư mục:  
```
adas_processor/models/y8best.pt
```

Chạy service:  
```bash
uvicorn service.adas_service:app --host 0.0.0.0 --port 5001 --reload
```

### 5️⃣ Cài đặt Frontend (React)  
```bash
cd client
npm install
npm run dev
```

---

## 🚀 Sử dụng  
1. Đăng ký & đăng nhập tài khoản.  
2. Thêm phương tiện.  
3. Upload video mô phỏng.  
4. Xem kết quả phân tích:  
   - Video đầu ra (có bounding box + thông số).  
   - Sensor Data (tốc độ, khoảng cách, TTC).  
   - Alerts (collision, obstacle, traffic sign).  

---

## 📂 Cấu trúc thư mục  
```
adas-simulation-app/
│── client/            # React frontend
│── server/            # Node.js backend
│   ├── src/models/    # Mongoose models
│   ├── src/services/  # Business logic
│   ├── src/routes/    # API routes
├   ├── processed/     # Video đầu ra (H.264)
│   └── uploads/       # Video upload
│
│── python-service/    # Python ADAS Processor
│   ├── core/          # detection, tracking, processing
│   ├── service/       # FastAPI endpoints
│   └── config/        # Config file
└── README.md
```

---

## 📊 Kết quả thực nghiệm  
- Video 30s được xử lý trong **~90s (GPU RTX 3060)** hoặc **~2 phút (CPU)**.  
- Hệ thống sinh ra **sensor data chuẩn xác** với khoảng cách, tốc độ tương đối, TTC.  
- Phát hiện chính xác **obstacle, collision risk, traffic sign**.  
- Giao diện hiển thị **dashboard trực quan** cho người dùng.  

---

## 🔮 Hướng phát triển  
- Bổ sung **lane detection** (CULane, TuSimple dataset).  
- Hỗ trợ **real-time camera streaming**.  
- Thêm **mobile app** (React Native).  
- Tích hợp **dashboard phân tích dữ liệu** (charts, thống kê).  
- Triển khai **Docker + Kubernetes** để mở rộng.  

---

## 👨‍💻 Tác giả  
- Ngô Phát Đạt – Developer  

📧 Liên hệ: ngophatdat2k5@gmail.com  
