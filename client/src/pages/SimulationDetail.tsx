import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import type { SensorData, Alert, Simulation } from "../types";
import {
  getSensorDataBySimulation,
  getAlerts,
  getSimulationById,
  getSimulationVideoUrl,
} from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SimulationDetailPage() {
  const { id: simulationId } = useParams<{ id: string }>();

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const fetchData = async () => {
    if (!simulationId) return;
    try {
      setLoading(true);

      // Simulation detail
      const resSim = await getSimulationById(simulationId);
      if (resSim.data.success) {
        setSimulation(resSim.data.data);
      } else {
        toast.error(resSim.data.message || "Không thể tải simulation");
      }

      // SensorData
      const resSensor = await getSensorDataBySimulation(
        simulationId,
        page,
        limit
      );
      if (resSensor.data.success) {
        setSensorData(resSensor.data.data.sensorData ?? []);
        setTotalPages(resSensor.data.data.totalPages);
      } else {
        toast.error(resSensor.data.message || "Không thể tải sensor data");
      }

      // Alerts
      const resAlerts = await getAlerts(page, limit);
      if (resAlerts.data.success) {
        const allAlerts = resAlerts.data.data.alerts ?? [];
        setAlerts(allAlerts.filter((a) => a.simulationId === simulationId));
      } else {
        toast.error(resAlerts.data.message || "Không thể tải alerts");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId, page, limit]);

  // Chuẩn bị dữ liệu cho chart
  const chartData = sensorData.map((s) => ({
    time: new Date(s.timestamp).toLocaleTimeString(),
    speed: s.speed,
    distance: s.distance_to_object ?? 0,
  }));

  // Hàm tải video
  const handleDownload = async () => {
    if (!simulation) return;
    try {
      const response = await fetch(getSimulationVideoUrl(simulation._id));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = simulation.filename || "simulation.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Không thể tải video");
      console.error(error);
    }
  };

  return (
    <>
      <PageMeta title="Simulation Detail" description="Chi tiết Simulation" />
      <PageBreadcrumb pageTitle="Simulation Detail" />

      <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chi tiết Simulation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Xem video, dữ liệu sensor, biểu đồ và cảnh báo ADAS
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-600 dark:text-gray-300">
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            {/* Video / Image */}
            {simulation && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                  Nội dung
                </h3>
                {simulation.fileType === "video" ? (
                  <div className="space-y-3">
                    <video
                      src={getSimulationVideoUrl(simulation._id)}
                      width="640"
                      height="360"
                      controls
                      className="rounded-xl shadow-lg"
                    >
                      Trình duyệt của bạn không hỗ trợ video.
                    </video>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                    >
                      ⬇ Tải video
                    </button>
                  </div>
                ) : (
                  <img
                    src={`http://localhost:5000${simulation.filepath}`}
                    alt={simulation.filename}
                    className="rounded-xl shadow-lg max-w-full h-auto"
                  />
                )}
              </div>
            )}

            {/* Toggle Sensor Data View */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Sensor Data
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("chart")}
                  className={`px-3 py-1 rounded ${
                    viewMode === "chart"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Biểu đồ
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Bảng
                </button>
              </div>
            </div>

            {/* Sensor Chart / Table */}
            {viewMode === "chart" ? (
              chartData.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  Không có dữ liệu để hiển thị biểu đồ.
                </p>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="speed"
                        stroke="#8884d8"
                        name="Tốc độ tương đối(km/h)"
                      />
                      <Line
                        type="monotone"
                        dataKey="distance"
                        stroke="#82ca9d"
                        name="Khoảng cách (m)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : sensorData.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                Không có sensor data.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-3 py-2 border">Thời gian</th>
                      <th className="px-3 py-2 border">Tốc độ tương đối</th>
                      <th className="px-3 py-2 border">Khoảng cách</th>
                      <th className="px-3 py-2 border">Làn đường</th>
                      <th className="px-3 py-2 border">Obstacle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensorData.map((s) => (
                      <tr
                        key={s._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-3 py-2 border">
                          {new Date(s.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2 border">{s.speed} km/h</td>
                        <td className="px-3 py-2 border">
                          {s.distance_to_object ?? "-"} m
                        </td>
                        <td className="px-3 py-2 border">{s.lane_status}</td>
                        <td className="px-3 py-2 border">
                          {s.obstacle_detected ? "Có" : "Không"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Alerts */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                Alerts
              </h3>
              {alerts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  Không có cảnh báo nào.
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((a) => (
                    <div
                      key={a._id}
                      className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {a.type.toUpperCase()}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            a.severity === "high"
                              ? "bg-red-600 text-white"
                              : a.severity === "medium"
                              ? "bg-yellow-500 text-white"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                        {a.description}
                      </p>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Trang {page}/{totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
