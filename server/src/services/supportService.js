// services/supportService.js
import Support from "../models/Support.js";
import nodemailer from "nodemailer";

export const createSupportRequest = async ({ name, email, subject, message }) => {
  if (!name || !email || !subject || !message) {
    throw new Error("Missing required fields");
  }

  // Lưu DB
  const support = new Support({ name, email, subject, message });
  await support.save();

  // Gửi email cho admin
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"ADAS Support" <${process.env.ADMIN_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "📩 Yêu cầu hỗ trợ mới từ khách hàng",
    text: `Khách hàng: ${name}\nEmail: ${email}\nTiêu đề: ${subject}\nNội dung: ${message}`,
  });

  return support;
};

export const getSupportRequests = async ({ page = 1, limit = 10, search, status, sort = "-createdAt" }) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Support.find(query).sort(sort).skip(skip).limit(limit),
    Support.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateSupportRequest = async (id, update) => {
  const support = await Support.findByIdAndUpdate(id, update, { new: true });
  if (!support) throw new Error("Support not found");
  return support;
};

export const deleteSupportRequest = async (id) => {
  const support = await Support.findByIdAndDelete(id);
  if (!support) throw new Error("Support not found");
  return;
};
