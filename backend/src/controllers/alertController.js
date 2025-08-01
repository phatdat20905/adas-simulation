import Alert from '../models/Alert.js';

const getAlerts = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const alerts = await Alert.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch alerts: ${error.message}` });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, userId: req.user.id };
    const alert = await Alert.findOneAndDelete(query);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or unauthorized' });
    }
    res.status(200).json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ error: `Failed to delete alert: ${error.message}` });
  }
};

export { getAlerts, deleteAlert };