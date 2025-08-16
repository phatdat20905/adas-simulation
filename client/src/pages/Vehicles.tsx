import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, deleteVehicle } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import type { Vehicle } from '../types';

function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [brand, setBrand] = useState<string>('Honda');
  const [model, setModel] = useState<string>('');
  const [color, setColor] = useState<string>('black');
  const [engineType, setEngineType] = useState<string>('petrol');
  const [engineCapacity, setEngineCapacity] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await getVehicles();
        console.log('Vehicles response:', response.data); // Debug
        if (response.data.success) {
          setVehicles(response.data.data.vehicles || []); // Sửa: lấy response.data.data.vehicles
        } else {
          toast.error(response.data.message);
        }
      } catch (err: any) {
        console.error('Vehicles error:', err.response?.data); // Debug
        toast.error(err.response?.data?.message || 'Không thể tải danh sách xe');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const validateLicensePlate = (plate: string): boolean => /^\d{2}-[A-Z]{1,2}\d\s\d{3}\.\d{2}$/.test(plate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLicensePlate(licensePlate)) {
      toast.error('Biển số không đúng định dạng (e.g., 29-H1 123.45)');
      return;
    }
    if (model.length < 2) {
      toast.error('Model xe phải có ít nhất 2 ký tự');
      return;
    }
    const capacity = engineCapacity ? parseInt(engineCapacity) : undefined;
    if (capacity && (capacity < 50 || capacity > 500)) {
      toast.error('Dung tích xi-lanh phải từ 50cc đến 500cc');
      return;
    }
    setIsLoading(true);
    try {
      const response = await createVehicle({ licensePlate, brand, model, color, engineType, engineCapacity: capacity });
      console.log('Create vehicle response:', response.data); // Debug
      if (response.data.success) {
        setVehicles([...vehicles, response.data.data]);
        setLicensePlate('');
        setBrand('Honda');
        setModel('');
        setColor('black');
        setEngineType('petrol');
        setEngineCapacity('');
        toast.success('Thêm xe thành công!');
      } else {
        toast.error(response.data.message);
      }
    } catch (err: any) {
      console.error('Create vehicle error:', err.response?.data); // Debug
      toast.error(err.response?.data?.message || 'Thêm xe thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa xe này?')) return;
    setIsLoading(true);
    try {
      const response = await deleteVehicle(id);
      console.log('Delete vehicle response:', response.data); // Debug
      if (response.data.success) {
        setVehicles(vehicles.filter((vehicle) => vehicle._id !== id));
        toast.success('Xóa xe thành công!');
      } else {
        toast.error(response.data.message);
      }
    } catch (err: any) {
      console.error('Delete vehicle error:', err.response?.data); // Debug
      toast.error(err.response?.data?.message || 'Xóa xe thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Quản lý xe</h2>
          {isLoading && <p className="text-center">Đang tải...</p>}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">Thêm xe</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Biển số</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                    placeholder="e.g., 29-H1 123.45"
                  />
                </div>
                <div>
                  <label className="block mb-1">Hãng xe</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Piaggio">Piaggio</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="SYM">SYM</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block mb-1">Màu sắc</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  >
                    <option value="black">Đen</option>
                    <option value="white">Trắng</option>
                    <option value="red">Đỏ</option>
                    <option value="blue">Xanh</option>
                    <option value="silver">Bạc</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Loại động cơ</label>
                  <select
                    value={engineType}
                    onChange={(e) => setEngineType(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  >
                    <option value="petrol">Xăng</option>
                    <option value="electric">Điện</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Dung tích xi-lanh (cc)</label>
                  <input
                    type="number"
                    value={engineCapacity}
                    onChange={(e) => setEngineCapacity(e.target.value)}
                    className="border rounded p-2 w-full"
                    disabled={isLoading}
                    placeholder="50-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Đang thêm...' : 'Thêm xe'}
              </button>
            </form>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Danh sách xe</h3>
            {vehicles.length === 0 && !isLoading ? (
              <p className="text-gray-500">Chưa có xe nào. Thêm xe ở trên!</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Biển số</th>
                    <th className="border p-2">Hãng</th>
                    <th className="border p-2">Model</th>
                    <th className="border p-2">Màu</th>
                    <th className="border p-2">Động cơ</th>
                    <th className="border p-2">Dung tích</th>
                    <th className="border p-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td className="border p-2">{vehicle.licensePlate}</td>
                      <td className="border p-2">{vehicle.brand}</td>
                      <td className="border p-2">{vehicle.model}</td>
                      <td className="border p-2">{vehicle.color}</td>
                      <td className="border p-2">{vehicle.engineType}</td>
                      <td className="border p-2">{vehicle.engineCapacity || 'N/A'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleDelete(vehicle._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Vehicles;