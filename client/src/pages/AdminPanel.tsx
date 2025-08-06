import { useState, useEffect } from 'react';
import { getUsers, getVehicles, getSimulations } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import type { User, Vehicle, Simulation } from '../types';

function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [simPage, setSimPage] = useState(1);
  const [simTotalPages, setSimTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userResponse = await getUsers();
        setUsers(userResponse.data);
        const vehicleResponse = await getVehicles();
        setVehicles(vehicleResponse.data);
        const simResponse = await getSimulations(simPage);
        setSimulations(simResponse.data.simulations);
        setSimTotalPages(simResponse.data.totalPages);
      } catch (err: any) {
        toast.error('Failed to fetch admin data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [simPage]);

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
          {isLoading && <p className="text-center">Loading...</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Users</h3>
              {users.length === 0 && !isLoading ? (
                <p className="text-gray-500">No users found.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Username</th>
                      <th className="border p-2">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="border p-2">{user.username}</td>
                        <td className="border p-2">{user.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Vehicles</h3>
              {vehicles.length === 0 && !isLoading ? (
                <p className="text-gray-500">No vehicles found.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">License Plate</th>
                      <th className="border p-2">Brand</th>
                      <th className="border p-2">Model</th>
                      <th className="border p-2">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle._id}>
                        <td className="border p-2">{vehicle.licensePlate}</td>
                        <td className="border p-2">{vehicle.brand}</td>
                        <td className="border p-2">{vehicle.model}</td>
                        <td className="border p-2">{vehicle.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Simulations</h3>
              {simulations.length === 0 && !isLoading ? (
                <p className="text-gray-500">No simulations found.</p>
              ) : (
                <>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2">Filename</th>
                        <th className="border p-2">Status</th>
                        <th className="border p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulations.map((sim) => (
                        <tr key={sim._id}>
                          <td className="border p-2">{sim.filename}</td>
                          <td className="border p-2">{sim.status}</td>
                          <td className="border p-2">
                            <a href={`/simulations/${sim._id}`} className="text-blue-500 hover:underline">
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
