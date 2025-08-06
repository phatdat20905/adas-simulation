import { useState, useEffect } from 'react';
import { getSimulations, getAlerts } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import type { Simulation, Alert } from '../types';

function Dashboard() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [simPage, setSimPage] = useState(1);
  const [alertPage, setAlertPage] = useState(1);
  const [simTotalPages, setSimTotalPages] = useState(1);
  const [alertTotalPages, setAlertTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const simResponse = await getSimulations(simPage);
        setSimulations(simResponse.data.simulations);
        setSimTotalPages(simResponse.data.totalPages);
        const alertResponse = await getAlerts(alertPage);
        setAlerts(alertResponse.data.alerts);
        setAlertTotalPages(alertResponse.data.totalPages);
      } catch (err: any) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [simPage, alertPage]);

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          {isLoading && <p className="text-center">Loading...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Recent Simulations</h3>
              {simulations.length === 0 && !isLoading ? (
                <p className="text-gray-500">No simulations yet. Try uploading a video!</p>
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
                      Previous
                    </button>
                    <span>Page {simPage} of {simTotalPages}</span>
                    <button
                      onClick={() => setSimPage((p) => p + 1)}
                      disabled={simPage === simTotalPages || isLoading}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Recent Alerts</h3>
              {alerts.length === 0 && !isLoading ? (
                <p className="text-gray-500">No alerts yet.</p>
              ) : (
                <>
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
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setAlertPage((p) => Math.max(p - 1, 1))}
                      disabled={alertPage === 1 || isLoading}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      Previous
                    </button>
                    <span>Page {alertPage} of {alertTotalPages}</span>
                    <button
                      onClick={() => setAlertPage((p) => p + 1)}
                      disabled={alertPage === alertTotalPages || isLoading}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      Next
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
