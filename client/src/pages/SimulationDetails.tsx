import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSimulationById, getSensorDataBySimulation, getAlerts } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SensorChart from '../components/SensorChart';
import toast from 'react-hot-toast';
import type { Simulation, SensorData, Alert } from '../types';

function SimulationDetails() {
  const { id } = useParams<{ id: string }>();
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const simResponse = await getSimulationById(id);
        console.log('Simulation response:', simResponse.data); // Debug
        if (simResponse.data.success) {
          setSimulation(simResponse.data.data);
        }
        const sensorResponse = await getSensorDataBySimulation(id, page);
        console.log('SensorData response:', sensorResponse.data); // Debug
        if (sensorResponse.data.success) {
          setSensorData(sensorResponse.data.data.sensorData || []);
          setTotalPages(sensorResponse.data.data.totalPages || 1);
        }
        const alertResponse = await getAlerts(page);
        console.log('Alerts response:', alertResponse.data); // Debug
        if (alertResponse.data.success) {
          setAlerts(alertResponse.data.data.alerts?.filter((alert: Alert) => alert.simulationId === id) || []);
        }
      } catch (err: any) {
        console.error('SimulationDetails error:', err.response?.data); // Debug
        toast.error(err.response?.data?.message || 'Không thể tải chi tiết mô phỏng');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, page]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Chi tiết mô phỏng</h2>
          {isLoading && <p className="text-center">Đang tải...</p>}
          {simulation && (
            <div className="bg-white p-4 rounded shadow mb-6">
              <h3 className="text-lg font-semibold mb-2">Thông tin mô phỏng</h3>
              <p><strong>Tên file:</strong> {simulation.filename}</p>
              <p><strong>Trạng thái:</strong> {simulation.status}</p>
              <p><strong>Số cảnh báo:</strong> {simulation.result.totalAlerts}</p>
              <p><strong>Va chạm:</strong> {simulation.result.collisionCount}</p>
              <p><strong>Lệch làn:</strong> {simulation.result.laneDepartureCount}</p>
              <p><strong>Chướng ngại vật:</strong> {simulation.result.obstacleCount}</p>
              <p><strong>Biển báo:</strong> {simulation.result.trafficSignCount}</p>
            </div>
          )}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">Dữ liệu cảm biến</h3>
            {sensorData.length === 0 && !isLoading ? (
              <p className="text-gray-500">Không có dữ liệu cảm biến.</p>
            ) : (
              <>
                <SensorChart sensorData={sensorData} />
                <table className="w-full border-collapse mt-4">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Thời gian</th>
                      <th className="border p-2">Tốc độ (km/h)</th>
                      <th className="border p-2">Khoảng cách (m)</th>
                      <th className="border p-2">Trạng thái làn</th>
                      <th className="border p-2">Chướng ngại</th>
                      <th className="border p-2">Frame</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensorData.map((data) => (
                      <tr key={data._id}>
                        <td className="border p-2">{new Date(data.timestamp).toLocaleString('vi-VN')}</td>
                        <td className="border p-2">{data.speed}</td>
                        <td className="border p-2">{data.distance_to_object || 'N/A'}</td>
                        <td className="border p-2">{data.lane_status}</td>
                        <td className="border p-2">{data.obstacle_detected ? 'Có' : 'Không'}</td>
                        <td className="border p-2">
                          {data.camera_frame_url && (
                            <img
                              src={data.camera_frame_url}
                              alt="Frame"
                              className="w-24 h-24 object-cover"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1 || isLoading}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                  >
                    Trước
                  </button>
                  <span>Trang {page}/{totalPages}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages || isLoading}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                  >
                    Sau
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Cảnh báo</h3>
            {alerts.length === 0 && !isLoading ? (
              <p className="text-gray-500">Không có cảnh báo cho mô phỏng này.</p>
            ) : (
              <ul>
                {alerts.map((alert) => (
                  <li key={alert._id} className="mb-2">
                    {alert.description} -{' '}
                    <span className={`font-semibold ${alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`}>
                      {alert.severity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SimulationDetails;