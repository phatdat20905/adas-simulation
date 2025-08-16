import { useState, useEffect } from 'react';
import { getUsers, getVehicles, getSimulations } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import type { User, Vehicle, Simulation } from '../types';

function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [simPage, setSimPage] = useState<number>(1);
  const [simTotalPages, setSimTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userResponse = await getUsers();
        console.log('Users response:', userResponse.data); // Debug
        if (userResponse.data.success) {
          setUsers(userResponse.data.data || []);
        }
        const vehicleResponse = await getVehicles();
        console.log('Vehicles response:', vehicleResponse.data); // Debug
        if (vehicleResponse.data.success) {
          setVehicles(vehicleResponse.data.data?.vehicles || []);
        }
        const simResponse = await getSimulations(simPage);
        console.log('Simulations response:', simResponse.data); // Debug
        if (simResponse.data.success) {
          setSimulations(simResponse.data.data?.simulations || []);
          setSimTotalPages(simResponse.data.data?.totalPages || 1);
        }
      } catch (err: any) {
        console.error('AdminPanel error:', err.response?.data); // Debug
        toast.error(err.response?.data?.message || 'Không thể tải dữ liệu admin');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [simPage]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Bảng điều khiển Admin</h2>
          {isLoading && <p className="text-center">Đang tải...</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Người dùng</h3>
              {users.length === 0 && !isLoading ? (
                <p className="text-gray-500">Không có người dùng.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Tên người dùng</th>
                      <th className="border p-2">Email</th>
                      <th className="border p-2">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="border p-2">{user.username}</td>
                        <td className="border p-2">{user.email}</td>
                        <td className="border p-2">{user.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Xe</h3>
              {vehicles.length === 0 && !isLoading ? (
                <p className="text-gray-500">Không có xe.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Biển số</th>
                      <th className="border p-2">Hãng</th>
                      <th className="border p-2">Model</th>
                      <th className="border p-2">Màu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle._id}>
                        <td className="border p-2">{vehicle.licensePlate}</td>
                        <td className="border p-2">{vehicle.brand}</td>
                        <td className="border p-2">{vehicle.model}</td>
                        <td className="border p-2">{vehicle.color}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Mô phỏng</h3>
              {simulations.length === 0 && !isLoading ? (
                <p className="text-gray-500">Không có mô phỏng.</p>
              ) : (
                <>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2">Tên file</th>
                        <th className="border p-2">Trạng thái</th>
                        <th className="border p-2">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulations.map((sim) => (
                        <tr key={sim._id}>
                          <td className="border p-2">{sim.filename}</td>
                          <td className="border p-2">{sim.status}</td>
                          <td className="border p-2">
                            <a href={`/simulations/${sim._id}`} className="text-blue-500 hover:underline">
                              Xem
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;