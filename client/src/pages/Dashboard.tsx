import { useState, useEffect } from 'react';
import { getSimulations, getAlerts } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import type { Simulation, Alert } from '../types';

const socket = io('http://localhost:5000');

function Dashboard() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [simPage, setSimPage] = useState<number>(1);
  const [alertPage, setAlertPage] = useState<number>(1);
  const [simTotalPages, setSimTotalPages] = useState<number>(1);
  const [alertTotalPages, setAlertTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const simResponse = await getSimulations(simPage);
        console.log('Simulations response:', simResponse.data);
        if (simResponse.data.success) {
          setSimulations(simResponse.data.data?.simulations || []);
          setSimTotalPages(simResponse.data.data?.totalPages || 1);
        } else {
          toast.error(simResponse.data.message || 'Lỗi khi tải mô phỏng');
        }
        const alertResponse = await getAlerts(alertPage);
        console.log('Alerts response:', alertResponse.data);
        if (alertResponse.data.success) {
          setAlerts(alertResponse.data.data?.alerts || []);
          setAlertTotalPages(alertResponse.data.data?.totalPages || 1);
        } else {
          toast.error(alertResponse.data.message || 'Lỗi khi tải cảnh báo');
        }
      } catch (err: any) {
        console.error('Dashboard error:', err.response?.data);
        toast.error(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    socket.on('alert', (alert: Alert) => {
      toast.custom(
        <div className={`p-4 rounded shadow ${alert.severity === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <strong>{alert.type}</strong>: {alert.description}
        </div>
      );
      setAlerts((prev) => [alert, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.off('alert');
    };
  }, [simPage, alertPage]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          {isLoading && <p className="text-center">Đang tải...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Các mô phỏng gần đây</h3>
              {simulations.length === 0 && !isLoading ? (
                <p className="text-gray-500">Chưa có mô phỏng. Hãy upload video!</p>
              ) : (
                <>
                  <ul>
                    {simulations.map((sim) => (
                      <li key={sim._id} className="mb-2">
                        <a href={`/simulations/${sim._id}`} className="text-blue-500 hover:underline">
                          {sim.filename} ({sim.status})
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setSimPage((p) => Math.max(p - 1, 1))}
                      disabled={simPage === 1 || isLoading}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      Trước
                    </button>
                    <span>Trang {simPage}/{simTotalPages}</span>
                    <button
                      onClick={() => setSimPage((p) => p + 1)}
                      disabled={simPage === simTotalPages || isLoading}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      Sau
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Cảnh báo gần đây</h3>
              {alerts.length === 0 && !isLoading ? (
                <p className="text-gray-500">Chưa có cảnh báo.</p>
              ) : (
                <>
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
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setAlertPage((p) => Math.max(p - 1, 1))}
                      disabled={alertPage === 1 || isLoading}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      Trước
                    </button>
                    <span>Trang {alertPage}/{alertTotalPages}</span>
                    <button
                      onClick={() => setAlertPage((p) => p + 1)}
                      disabled={alertPage === alertTotalPages || isLoading}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      Sau
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;