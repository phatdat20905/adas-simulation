// src/pages/SupportPage.tsx
import { Mail, Phone, MessageCircle, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { createSupport } from "../services/api"; // 👉 import API

const faqs = [
  {
    question: "ADAS hoạt động như thế nào trên xe máy?",
    answer:
      "Hệ thống ADAS phân tích hình ảnh từ camera, đưa ra cảnh báo va chạm, cảnh báo chệch làn và hỗ trợ người lái an toàn hơn.",
  },
  {
    question: "Tôi có cần internet để sử dụng không?",
    answer:
      "Một số tính năng hoạt động offline, nhưng để nhận cập nhật và đồng bộ dữ liệu, cần có kết nối internet.",
  },
  {
    question: "Tôi gặp lỗi khi tải video lên?",
    answer:
      "Hãy kiểm tra định dạng video (.mp4, .avi) và dung lượng file. Nếu vẫn lỗi, vui lòng liên hệ đội hỗ trợ.",
  },
];

export default function SupportPage() {
  const [chatVisible, setChatVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const toggleChat = () => {
    setChatVisible((prev) => !prev);

    // Messenger widget
    const fbChat = document.getElementById("fb-customer-chat");
    if (fbChat) fbChat.style.display = chatVisible ? "none" : "block";

    // Zalo widget
    const zaloChat = document.querySelector<HTMLElement>(".zalo-chat-widget");
    if (zaloChat) zaloChat.style.display = chatVisible ? "none" : "block";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await createSupport(formData);
      if (res.data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Trung Tâm Hỗ Trợ ADAS
          </motion.h1>
          <p className="text-lg md:text-xl mb-6">
            Chúng tôi sẵn sàng hỗ trợ bạn 24/7 để đảm bảo an toàn khi lái xe.
          </p>
          <a
            href="#contact"
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow hover:bg-gray-100 transition"
          >
            Liên hệ ngay
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Câu hỏi thường gặp
        </h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
              <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-gray-100 dark:bg-gray-800 py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 text-center">Liên hệ hỗ trợ</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Thông tin liên hệ */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-blue-600" />
                <span>Hotline: 1900-1234</span>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-blue-600" />
                <span>Email: support@adas.vn</span>
              </div>
              <div className="flex items-center gap-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <span>Chat trực tiếp với kỹ thuật viên</span>
              </div>
            </div>

            {/* Form liên hệ */}
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow space-y-4"
            >
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Họ và tên"
                className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                required
              />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Nội dung hỗ trợ..."
                rows={4}
                className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                required
              ></textarea>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>

              {status === "success" && (
                <p className="text-green-600 text-sm mt-2">
                  ✅ Yêu cầu của bạn đã được gửi thành công!
                </p>
              )}
              {status === "error" && (
                <p className="text-red-600 text-sm mt-2">
                  ❌ Gửi yêu cầu thất bại, vui lòng thử lại.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Floating Chat Toggle */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
