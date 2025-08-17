import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicles, uploadFile, simulateADAS } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import type { Vehicle } from '../types';

const socket = io('http://localhost:5000');

function Simulate() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await getVehicles();
        console.log('Vehicles response:', response.data);
        if (response.data.success) {
          setVehicles(response.data.data?.vehicles || []);
          if (response.data.data?.vehicles?.length > 0) setVehicleId(response.data.data.vehicles[0]._id);
        } else {
          toast.error(response.data.message || 'Không thể tải danh sách xe');
        }
      } catch (err: any) {
        console.error('Vehicles error:', err.response?.data);
        toast.error(err.response?.data?.message || 'Không thể tải danh sách xe');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();

    socket.on('simulationStatus', (data: { simulationId: string; status: string }) => {
      console.log('Simulation status:', data); // Debug
      toast.custom(
        <div className={`p-4 rounded shadow ${data.status === 'failed' ? 'bg-red-100' : 'bg-blue-100'}`}>
          Mô phỏng {data.simulationId}: {data.status === 'completed' ? 'Hoàn thành' : 'Thất bại'}
        </div>
      );
      if (data.status === 'completed') {
        navigate(`/simulations/${data.simulationId}`);
      }
    });

    return () => {
      socket.off('simulationStatus');
    };
  }, [navigate]);

  const validateFile = (file: File): string => {
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (!validTypes.includes(file.type)) {
      return 'Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, hoặc MP4.';
    }
    if (file.size > maxSize) {
      return 'Kích thước file vượt quá 100MB.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !vehicleId) {
      toast.error('Vui lòng chọn xe và file');
      return;
    }
    const fileError = validateFile(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicleId', vehicleId);
      const uploadResponse = await uploadFile(formData);
      console.log('Upload response:', uploadResponse.data);
      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || 'Upload failed');
      }
      const simulationId = uploadResponse.data.data?.simulation?._id;
      if (!simulationId) {
        throw new Error('Simulation ID not found in upload response');
      }
      const simulateResponse = await simulateADAS({ simulationId });
      console.log('Simulate response:', simulateResponse.data);
      if (simulateResponse.data.success) {
        toast.success('Bắt đầu mô phỏng!');
      } else {
        throw new Error(simulateResponse.data.message || 'Simulation failed');
      }
    } catch (err: any) {
      console.error('Simulate error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || err.message || 'Mô phỏng thất bại');
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
          <h2 className="text-2xl font-bold mb-4">Upload & Mô phỏng</h2>
          {isLoading && <p className="text-center">Đang tải...</p>}
          <div className="bg-white p-4 rounded shadow">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1">Chọn xe</label>
                {vehicles.length === 0 && !isLoading ? (
                  <p className="text-gray-500">Chưa có xe. Thêm xe tại trang Quản lý xe.</p>
                ) : (
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  >
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1">Upload File (Ảnh/Video)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,video/mp4"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="border rounded p-2 w-full"
                  required
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading || vehicles.length === 0}
              >
                {isLoading ? 'Đang upload...' : 'Upload & Mô phỏng'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Simulate;