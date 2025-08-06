import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicles, uploadFile, simulate } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import type { Vehicle } from '../types';

function Simulate() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await getVehicles();
        setVehicles(response.data);
        if (response.data.length > 0) setVehicleId(response.data[0]._id);
      } catch (err: any) {
        toast.error('Failed to fetch vehicles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Only JPG, PNG, or MP4 are allowed.';
    }
    if (file.size > maxSize) {
      return 'File size exceeds 100MB limit.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !vehicleId) {
      toast.error('Please select a vehicle and file');
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
      const simulationId = uploadResponse.data.simulationId;
      await simulate({ simulationId });
      toast.success('Simulation started successfully!');
      setTimeout(() => navigate(`/simulations/${simulationId}`), 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Upload & Simulate</h2>
          {isLoading && <p className="text-center">Loading...</p>}
          <div className="bg-white p-4 rounded shadow">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1">Select Vehicle</label>
                {vehicles.length === 0 && !isLoading ? (
                  <p className="text-gray-500">No vehicles available. Add one in Vehicles page.</p>
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
                <label className="block mb-1">Upload File (Image/Video)</label>
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
                {isLoading ? 'Uploading...' : 'Upload & Simulate'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Simulate;
