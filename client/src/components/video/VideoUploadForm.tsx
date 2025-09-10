import { useRef, useState } from "react";
import toast from "react-hot-toast";
import type { Vehicle, Simulation } from "../../types";
import api, { uploadFile as uploadFileApi } from "../../services/api"; // default api and helper
import { createSimulation } from "../../services/api"; // in case you want a fallback
// Props: vehicles list and callback
interface Props {
  vehicles: Vehicle[];
  onUploadSuccess?: (simulation?: Simulation) => void;
}

export default function VideoUploadForm({ vehicles, onUploadSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePick = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validation
    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file video (mp4, mov, ...)");
      return;
    }
    if (!selectedVehicle) {
      toast.error("Bạn cần chọn xe (vehicle) để gán simulation");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("vehicleId", selectedVehicle);

    try {
      setUploading(true);
      setProgress(0);

      // Use api.post directly to get upload progress
      const resp = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });

      if (resp.data?.success) {
        toast.success("Upload thành công. Simulation được tạo.");
        const sim = resp.data.data?.simulation ?? resp.data.data;
        onUploadSuccess?.(sim);
      } else {
        toast.error(resp.data?.message || "Upload thất bại");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.response?.data?.message || err.message || "Upload thất bại");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Chọn xe (vehicle)</label>
          <select
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            <option value="">-- Chọn xe --</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.licensePlate} — {v.brand} {v.model ? `(${v.model})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePick}
            className="px-4 py-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            disabled={uploading}
          >
            Chọn file
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2 overflow-hidden">
            <div style={{ width: `${progress}%` }} className="h-2 bg-blue-600" />
          </div>
          <div className="text-sm text-gray-600 mt-1">{progress}%</div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">Max 500MB. Hệ thống sẽ tạo một simulation và trả về trạng thái xử lý.</p>
    </div>
  );
}
