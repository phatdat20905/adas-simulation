import Support from "../models/Support.js";
import nodemailer from "nodemailer";

/**
 * Tạo yêu cầu hỗ trợ mới và gửi email thông báo cho admin
 */
export const createSupportRequest = async ({ name, email, subject, message }) => {
  if (!name || !email || !subject || !message) {
    throw new Error("Missing required fields");
  }

  // Lưu vào DB
  const support = await Support.create({ name, email, subject, message });

  // Gửi email thông báo cho admin
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
    text: `Khách hàng: ${name}
Email: ${email}
Tiêu đề: ${subject}
Nội dung: ${message}`,
  });

  return support;
};

/**
 * Lấy danh sách yêu cầu hỗ trợ (có phân trang, tìm kiếm, lọc trạng thái, sắp xếp)
 */
export const getSupportRequests = async ({
  page = 1,
  limit = 10,
  search,
  status,
  sort = "-createdAt",
}) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name:    { $regex: search, $options: "i" } },
      { email:   { $regex: search, $options: "i" } },
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
};
