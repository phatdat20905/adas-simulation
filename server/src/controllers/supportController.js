// controllers/supportController.js
import * as supportService from "../services/supportService.js";

export const createSupport = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const support = await supportService.createSupportRequest({ name, email, subject, message });
    res.status(201).json({ success: true, data: support });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSupports = async (req, res) => {
  try {
    const { page, limit, search, status, sort } = req.query;
    const supports = await supportService.getSupportRequests({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      status,
      sort,
    });
    res.json({ success: true, ...supports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const support = await supportService.updateSupportRequest(id, req.body);
    res.json({ success: true, data: support });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSupport = async (req, res) => {
  try {
    const { id } = req.params;
    await supportService.deleteSupportRequest(id);
    res.json({ success: true, message: "Support deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
