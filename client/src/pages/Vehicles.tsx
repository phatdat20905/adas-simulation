import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, deleteVehicle } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import type { Vehicle } from '../types';

function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await getVehicles();
        setVehicles(response.data);
      } catch (err: any) {
        toast.error('Failed to fetch vehicles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (licensePlate.length < 3) {
      toast.error('License plate must be at least 3 characters');
      return;
    }
    if (brand.length < 2 || model.length < 2) {
      toast.error('Brand and model must be at least 2 characters');
      return;
    }
    if (year < '1900' || year > new Date().getFullYear().toString()) {
      toast.error('Invalid year');
      return;
    }
    setIsLoading(true);
    try {
      const response = await createVehicle({ licensePlate, brand, model, year: parseInt(year) });
      setVehicles([...vehicles, response.data]);
      setLicensePlate('');
      setBrand('');
      setModel('');
      setYear('');
      toast.success('Vehicle added successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    setIsLoading(true);
    try {
      await deleteVehicle(id);
      setVehicles(vehicles.filter((vehicle) => vehicle._id !== id));
      toast.success('Vehicle deleted successfully!');
    } catch (err: any) {
      toast.error('Failed to delete vehicle');
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
          <h2 className="text-2xl font-bold mb-4">Vehicles</h2>
          {isLoading && <p className="text-center">Loading...</p>}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">Add Vehicle</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">License Plate</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  />
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
                  <label className="block mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Vehicle'}
              </button>
            </form>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Your Vehicles</h3>
            {vehicles.length === 0 && !isLoading ? (
              <p className="text-gray-500">No vehicles yet. Add one above!</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">License Plate</th>
                    <th className="border p-2">Brand</th>
                    <th className="border p-2">Model</th>
                    <th className="border p-2">Year</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td className="border p-2">{vehicle.licensePlate}</td>
                      <td className="border p-2">{vehicle.brand}</td>
                      <td className="border p-2">{vehicle.model}</td>
                      <td className="border p-2">{vehicle.year}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleDelete(vehicle._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          Delete
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
