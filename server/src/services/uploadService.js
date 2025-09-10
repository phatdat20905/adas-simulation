import { createSimulation } from './simulationService.js';
import Vehicle from '../models/Vehicle.js';

const uploadFile = async ({ file, vehicleId, userId }) => {
  if (!file || !vehicleId) {
    throw new Error('File and vehicle ID are required');
  }

  const isValidVehicle = await Vehicle.exists({ _id: vehicleId, owner: userId });
  if (!isValidVehicle) {
    throw new Error('Invalid vehicle or unauthorized');
  }

  // Xác định subDir đúng cho filepath
  const subDir = file.mimetype.startsWith('video') ? 'videos' : 'images';

  const simulation = await createSimulation({
    filename: file.filename,
    filepath: `/Uploads/${subDir}/${file.filename}`,
    fileType: file.mimetype.startsWith('video') ? 'video' : 'image',
    vehicleId,
    userId,
  });

  return simulation;
};

export { uploadFile };
