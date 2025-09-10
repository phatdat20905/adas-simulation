import type { Simulation } from "../../types";
import { simulateADAS, deleteSimulation } from "../../services/api";
import toast from "react-hot-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  simulations: Simulation[];
  loading?: boolean;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
}

export default function VideoList({
  simulations,
  loading,
  onRefresh,
  onDelete,
  page = 1,
  totalPages = 1,
  onPageChange,
}: Props) {
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const handleProcess = async (id: string) => {
    if (processingIds[id]) return;
    try {
      setProcessingIds((s) => ({ ...s, [id]: true }));
      const res = await simulateADAS({ simulationId: id });
      if (res.data.success) {
        toast.success("Simulation queued/processed");
        onRefresh?.();
      } else {
        toast.error(res.data.message || "Không thể xử lý");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Lỗi server");
    } finally {
      setProcessingIds((s) => ({ ...s, [id]: false }));
    }
  };

  const handleView = (sim: Simulation) => {
    navigate(`/simulation-details/${sim._id}`);
  };

  const handleDelete = (id: string) => {
    if (onDelete) onDelete(id);
    else deleteSimulation(id).then(() => onRefresh?.());
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="py-8 text-center text-gray-600">Đang tải…</div>
      ) : simulations.length === 0 ? (
        <div className="py-6 text-center text-gray-600">Không có simulation</div>
      ) : (
        simulations.map((s) => (
          <div
            key={s._id}
            className="flex items-center justify-between p-3 border rounded bg-white dark:bg-gray-800"
          >
            <div>
              <div className="font-medium">{s.filename}</div>
              <div className="text-sm text-gray-500">
                Xe: {s.vehicleId} — Trạng thái: {s.status}
              </div>
              <div className="text-sm text-gray-500">
                Alerts: {s.result?.totalAlerts ?? 0} — Data points:{" "}
                {s.sensorDataCount ?? 0}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleProcess(s._id)}
                className="px-3 py-1 rounded bg-gradient-to-r from-yellow-500 to-orange-500 text-white disabled:opacity-50"
                disabled={processingIds[s._id]}
              >
                {processingIds[s._id] ? "Processing…" : "Process"}
              </button>

              <button
                onClick={() => handleView(s)}
                className="px-3 py-1 rounded border border-gray-300"
              >
                View
              </button>

              <button
                onClick={() => handleDelete(s._id)}
                className="px-3 py-1 rounded bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* simple pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Trang {page} / {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
            className="px-3 py-1 rounded border"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
            className="px-3 py-1 rounded border"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
