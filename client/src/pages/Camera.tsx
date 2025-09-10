import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { Vehicle } from "../types";
import { getUserVehicles } from "../services/api";
import api from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

export default function CameraPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordBlobUrl, setRecordBlobUrl] = useState<string | null>(null);

  // load danh sách xe
  useEffect(() => {
    (async () => {
      try {
        const res = await getUserVehicles({ page: 1, limit: 1000 });
        if (res.data.success) setVehicles(res.data.data ?? []);
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      // chỉ revoke URL preview khi rời trang
      if (recordBlobUrl) URL.revokeObjectURL(recordBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      toast.success("Camera started");
    } catch (err) {
      console.error(err);
      toast.error("Không thể truy cập camera. Kiểm tra quyền.");
    }
  };

  const stopCamera = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      (videoRef.current.srcObject as MediaStream | null) = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
    chunksRef.current = [];
    setRecordBlobUrl(null);
    toast("Camera stopped");
  };

  const toggleRecording = () => {
    if (!isStreaming || !streamRef.current) {
      toast.error("Bắt đầu camera trước khi ghi");
      return;
    }

    if (!isRecording) {
      try {
        chunksRef.current = [];
        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";
        const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          setRecordBlobUrl(url);
        };
        recorder.start();
        recorderRef.current = recorder;
        setIsRecording(true);
        toast.success("Bắt đầu ghi");
      } catch (err) {
        console.error(err);
        toast.error("Không thể ghi video trên trình duyệt này");
      }
    } else {
      recorderRef.current?.stop();
      setIsRecording(false);
      toast("Kết thúc ghi");
    }
  };

  const uploadRecorded = async () => {
    if (!recordBlobUrl || !chunksRef.current.length) {
      toast.error("Không có bản ghi để upload");
      return;
    }
    if (!selectedVehicle) {
      toast.error("Chọn xe trước khi upload");
      return;
    }

    const blob = new Blob(chunksRef.current, {
      type: chunksRef.current[0]?.type || "video/webm",
    });
    const form = new FormData();
    const filename = `camera-${Date.now()}.webm`;
    form.append("file", blob, filename);
    form.append("vehicleId", selectedVehicle);

    try {
      const res = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        toast.success("Upload bản ghi thành công");
      } else {
        toast.error(res.data?.message || "Upload thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Upload lỗi");
    } finally {
      chunksRef.current = [];
      setRecordBlobUrl(null);
    }
  };

  return (
    <>
      <PageMeta title="Camera Live" description="Giám sát trực tiếp, ghi và upload để phân tích ADAS" />
      <PageBreadcrumb pageTitle="Camera Live" />

      <div className="p-6 border rounded-2xl bg-white dark:bg-gray-900 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Camera Live</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Giám sát trực tiếp, ghi và upload để phân tích ADAS
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-black rounded overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                  Camera not active
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                >
                  Stop Camera
                </button>
              )}

              <button
                onClick={toggleRecording}
                className="px-4 py-2 rounded bg-yellow-500 text-white"
                disabled={!isStreaming}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>

              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="ml-auto px-3 py-2 rounded border bg-white dark:bg-gray-800"
              >
                <option value="">-- Chọn xe để gán --</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.licensePlate} — {v.brand}
                  </option>
                ))}
              </select>
            </div>

            {recordBlobUrl && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Preview</h4>
                <video src={recordBlobUrl} controls className="w-full rounded" />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={uploadRecorded}
                    className="px-4 py-2 rounded bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => {
                      if (recordBlobUrl) URL.revokeObjectURL(recordBlobUrl);
                      setRecordBlobUrl(null);
                      chunksRef.current = [];
                    }}
                    className="px-4 py-2 rounded border"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Session</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div>Streaming: {isStreaming ? "Yes" : "No"}</div>
              <div>Recording: {isRecording ? "Yes" : "No"}</div>
              <div>Recorded: {recordBlobUrl ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
