import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSensorData, getAlerts } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SensorChart from '../components/SensorChart';
import toast, { Toaster } from 'react-hot-toast';
import type { SensorData, Alert } from '../types';

function SimulationDetails() {
  const { id } = useParams<{ id: string }>();
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const sensorResponse = await getSensorData(id, page);
        setSensorData(sensorResponse.data.sensorData);
        setTotalPages(sensorResponse.data.totalPages);
        const alertResponse = await getAlerts(page);
        setAlerts(alertResponse.data.alerts.filter((alert) => alert.simulationId === id));
      } catch (err: any) {
        toast.error('Failed to fetch simulation details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, page]);

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Simulation Details</h2>
          {isLoading && <p className="text-center">Loading...</p>}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">Sensor Data</h3>
            {sensorData.length === 0 && !isLoading ? (
              <p className="text-gray-500">No sensor data available.</p>
            ) : (
              <>
                <SensorChart sensorData={sensorData} />
                <table className="w-full border-collapse mt-4">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Timestamp</th>
                      <th className="border p-2">Speed (km/h)</th>
                      <th className="border p-2">Distance (m)</th>
                      <th className="border p-2">Lane Status</th>
                      <th className="border p-2">Obstacle</th>
                      <th className="border p-2">Alert Level</th>
                      <th className="border p-2">Frame</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensorData.map((data) => (
                      <tr key={data._id}>
                        <td className="border p-2">{new Date(data.timestamp).toLocaleString()}</td>
                        <td className="border p-2">{data.speed}</td>
                        <td className="border p-2">{data.distance_to_object || 'N/A'}</td>
                        <td className="border p-2">{data.lane_status}</td>
                        <td className="border p-2">{data.obstacle_detected ? 'Yes' : 'No'}</td>
                        <td className="border p-2">{data.alertLevel}</td>
                        <td className="border p-2">
                          {data.camera_frame_url && (
                            <img
                              src={`http://localhost:5000${data.camera_frame_url}`}
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
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages || isLoading}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Alerts</h3>
            {alerts.length === 0 && !isLoading ? (
              <p className="text-gray-500">No alerts for this simulation.</p>
            ) : (
              <ul>
                {alerts.map((alert) => (
                  <li key={alert._id} className="mb-2">
                    {alert.description} -{' '}
                    <span className={`font-semibold ${alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
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
