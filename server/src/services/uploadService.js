import { createSimulation } from './simulationService.js';
import Vehicle from '../models/Vehicle.js';

const uploadFile = async ({ file, vehicleId, userId }) => {
  if (!file || !vehicleId) {
    throw new Error('File and vehicle ID are required');
  }
  if (!(await Vehicle.exists({ _id: vehicleId, owner: userId }))) {
    throw new Error('Invalid vehicle or unauthorized');
  }

  const simulation = await createSimulation({
    filename: file.filename,
    filepath: `/Uploads/${file.filename}`,
    fileType: file.mimetype.startsWith('video') ? 'video' : 'image',
    vehicleId,
    userId,
  });

  return simulation;
};

export { uploadFile };