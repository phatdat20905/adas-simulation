import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { register } from "../../services/api";
import toast from "react-hot-toast";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string): boolean => /^0\d{9}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.length < 3 || fullName.length > 30) {
      toast.error("Họ và tên phải từ 3 đến 30 ký tự!");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Email không hợp lệ!");
      return;
    }
    if (!validatePhone(phone)) {
      toast.error("Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)!");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (!isChecked) {
      toast.error("Bạn phải đồng ý với Điều khoản và Chính sách!");
      return;
    }
    setIsLoading(true);
    try {
      const response = await register({ fullName, email, phone, password, role: "user" });
      if (response.data.success) {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/signin");
      } else {
        toast.error(response.data.message || "Đăng ký thất bại!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeft className="size-5" />
          Quay lại trang chính
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Đăng ký tài khoản
            </h1>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <Label>Họ và tên <span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label>Email <span className="text-error-500">*</span></Label>
                  <Input
                    type="email"
                    placeholder="Nhập email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label>Số điện thoại <span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label>Mật khẩu <span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      placeholder="Nhập mật khẩu"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <Eye className="size-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <EyeOff className="size-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                    disabled={isLoading}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Tôi đồng ý với{" "}
                    <span className="text-gray-800 dark:text-white/90">Điều khoản dịch vụ</span>{" "}
                    và{" "}
                    <span className="text-gray-800 dark:text-white">Chính sách bảo mật</span>
                  </p>
                </div>
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang xử lý..." : "Đăng ký"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Đã có tài khoản?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
