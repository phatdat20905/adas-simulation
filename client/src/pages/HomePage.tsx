import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero */}
      <section className="flex flex-1 items-center justify-center text-center px-6 py-20">
        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight"
          >
            🚦 HỆ THỐNG HỖ TRỢ LÁI XE AN TOÀN ADAS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10"
          >
            Quản lý phương tiện, phân tích tình huống giao thông và đưa ra cảnh báo an toàn 
            bằng công nghệ AI tiên tiến. Hãy đăng nhập để trải nghiệm ngay hôm nay!
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/signin"
              className="px-8 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow-md hover:bg-blue-700 transition"
            >
              Đăng nhập
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3 rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 text-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition"
            >
              Đăng ký
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
          {[
            {
              title: "📊 Quản lý phương tiện",
              desc: "Theo dõi thông tin xe, trạng thái và dữ liệu cảm biến trực quan.",
            },
            {
              title: "🎥 Phân tích video",
              desc: "Tải video hoặc sử dụng camera trực tiếp để mô phỏng và phát hiện nguy hiểm.",
            },
            {
              title: "⚠️ Cảnh báo tức thời",
              desc: "Nhận cảnh báo va chạm, chệch làn, vật cản và biển báo ngay lập tức.",
            },
            {
              title: "🔒 An toàn & Bảo mật",
              desc: "Dữ liệu của bạn luôn được bảo vệ với công nghệ mã hóa tiên tiến.",
            },
          ].map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {f.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700">
        © {new Date().getFullYear()} ADAS for Motorcycles. All rights reserved.
      </footer>
    </div>
  );
}
