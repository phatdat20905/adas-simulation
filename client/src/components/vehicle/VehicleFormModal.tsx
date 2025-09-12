import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import toast from "react-hot-toast";
import type { Vehicle } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Vehicle>) => void;
  initialData?: Vehicle | null;
}

export default function VehicleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}: Props) {
  const [form, setForm] = useState<Partial<Vehicle>>({
    licensePlate: "",
    brand: "Honda",
    model: "",
    color: "black",
    engineType: "petrol",
    engineCapacity: undefined,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        licensePlate: initialData.licensePlate || "",
        brand: initialData.brand || "Honda",
        model: initialData.model || "",
        color: initialData.color || "black",
        engineType: initialData.engineType || "petrol",
        engineCapacity: initialData.engineCapacity ?? undefined,
      });
    } else {
      setForm({
        licensePlate: "",
        brand: "Honda",
        model: "",
        color: "black",
        engineType: "petrol",
        engineCapacity: undefined,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]:
        name === "engineCapacity" ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validation
    if (!form.licensePlate || form.licensePlate.trim().length === 0) {
      toast.error("Biển số là bắt buộc");
      return;
    }
    if (!form.brand) {
      toast.error("Chọn hãng xe");
      return;
    }
    if (!form.model) {
      toast.error("Nhập model xe");
      return;
    }
    if (
      form.engineType === "petrol" &&
      (form.engineCapacity === undefined || form.engineCapacity <= 0)
    ) {
      toast.error("Nhập dung tích động cơ hợp lệ cho xe xăng");
      return;
    }
    onSubmit(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md m-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {initialData ? "Chỉnh sửa xe" : "Thêm xe mới"}
        </h4>

        <form className="grid grid-cols-1 gap-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label>Biển số</Label>
            <Input
              name="licensePlate"
              value={form.licensePlate || ""}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Hãng</Label>
              <select
                name="brand"
                value={form.brand || "Honda"}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Piaggio">Piaggio</option>
                <option value="Suzuki">Suzuki</option>
                <option value="SYM">SYM</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Model</Label>
              <Input name="model" value={form.model || ""} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Màu</Label>
              <select
                name="color"
                value={form.color || "black"}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <option value="black">Đen</option>
                <option value="white">Trắng</option>
                <option value="red">Đỏ</option>
                <option value="blue">Xanh</option>
                <option value="silver">Bạc</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Loại động cơ</Label>
              <select
                name="engineType"
                value={form.engineType || "petrol"}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <option value="petrol">Xăng</option>
                <option value="electric">Điện</option>
              </select>
            </div>
          </div>

          {form.engineType === "petrol" && (
            <div className="space-y-1">
              <Label>Dung tích (cc)</Label>
              <Input
                name="engineCapacity"
                type="number"
                value={form.engineCapacity ?? ""}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 
                         text-gray-700 dark:text-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
