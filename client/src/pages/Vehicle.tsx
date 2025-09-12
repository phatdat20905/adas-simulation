// components/user/UserVehiclePage.tsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Vehicle } from "../types";
import {
  getUserVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import VehicleFormModal from "../components/vehicle/VehicleFormModal";
import { useModal } from "../hooks/useModal";
import { Pencil, Trash2 } from "lucide-react";

export default function UserVehiclePage() {
  const { isOpen, openModal, closeModal } = useModal();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  // filters + pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState<"" | Vehicle["brand"]>("");
  const [engineType, setEngineType] = useState<"" | Vehicle["engineType"]>("");

  const [sort, setSort] = useState("-createdAt");

  // modal + selected
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search || undefined,
        brand: brand || undefined,
        engineType: engineType || undefined,
        sort,
      };
      const res = await getUserVehicles(params);
      if (res.data.success) {
        setVehicles(res.data.data ?? []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
        setTotal(res.data.pagination?.total ?? 0);
      } else {
        toast.error(res.data.message || "Không thể tải danh sách xe");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, brand, engineType, sort]);

  const resetToFirstPage = () => setPage(1);

  const onOpenCreate = () => {
    setSelectedVehicle(null);
    openModal();
  };

  const onOpenEdit = (v: Vehicle) => {
    setSelectedVehicle(v);
    openModal();
  };

  const handleSubmitVehicle = async (payload: Partial<Vehicle>) => {
    try {
      if (selectedVehicle) {
        // Update xe
        const res = await updateVehicle(selectedVehicle._id, payload);
        if (res.data.success) {
          toast.success("Cập nhật xe thành công");
        } else {
          toast.error(res.data.message || "Cập nhật thất bại");
        }
      } else {
        // Thêm xe
        const res = await createVehicle(payload as any);
        if (res.data.success) {
          toast.success("Thêm xe thành công");
        } else {
          toast.error(res.data.message || "Thêm thất bại");
        }
      }
      closeModal();
      fetchVehicles();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa xe này?")) return;
    try {
      const res = await deleteVehicle(id);
      if (res.data.success) {
        toast.success("Đã xóa xe");
        if (vehicles.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchVehicles();
      } else {
        toast.error(res.data.message || "Xóa thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // toggle trạng thái active/inactive
  const handleQuickToggleStatus = async (v: Vehicle) => {
    try {
      const res = await updateVehicle(v._id, {
        status: v.status === "active" ? "inactive" : "active",
      });
      if (res.data.success) {
        toast.success(
          `Đã ${v.status === "active" ? "vô hiệu hoá" : "kích hoạt"} xe`
        );
        fetchVehicles();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <>
      <PageMeta title="Xe của tôi" description="Quản lý xe cá nhân" />
      <PageBreadcrumb pageTitle="Xe của tôi" />

      <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Xe của tôi
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Danh sách xe mà bạn đã đăng ký trong hệ thống
            </p>
          </div>
          <div>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              Thêm xe
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <input
            type="text"
            placeholder="Tìm biển số, model..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 md:col-span-2"
          />

          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value as any);
              resetToFirstPage();
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="">Tất cả hãng</option>
            <option value="Honda">Honda</option>
            <option value="Yamaha">Yamaha</option>
            <option value="Piaggio">Piaggio</option>
            <option value="Suzuki">Suzuki</option>
            <option value="SYM">SYM</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={engineType}
            onChange={(e) => {
              setEngineType(e.target.value as any);
              resetToFirstPage();
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="">Tất cả loại máy</option>
            <option value="petrol">Petrol</option>
            <option value="electric">Electric</option>
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              resetToFirstPage();
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="-createdAt">Mới nhất</option>
            <option value="createdAt">Cũ nhất</option>
            <option value="licensePlate">Biển số (A-Z)</option>
            <option value="-licensePlate">Biển số (Z-A)</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Biển số</th>
                <th className="px-4 py-2 text-left">Hãng</th>
                <th className="px-4 py-2 text-left">Model</th>
                <th className="px-4 py-2 text-left">Màu</th>
                <th className="px-4 py-2 text-left">Loại máy</th>
                <th className="px-4 py-2 text-left">Dung tích</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Tạo lúc</th>
                <th className="px-4 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    Đang tải…
                  </td>
                </tr>
              ) : vehicles.length ? (
                vehicles.map((v) => (
                  <tr
                    key={v._id}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-4 py-2">{v.licensePlate}</td>
                    <td className="px-4 py-2">{v.brand}</td>
                    <td className="px-4 py-2">{v.model}</td>
                    <td className="px-4 py-2">{v.color}</td>
                    <td className="px-4 py-2 capitalize">{v.engineType}</td>
                    <td className="px-4 py-2">
                      {v.engineCapacity ? `${v.engineCapacity}cc` : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleQuickToggleStatus(v)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          v.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {v.status}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => onOpenEdit(v)}
                        title="Edit"
                        className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        title="Delete"
                        className="p-2 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Trang <span className="font-medium">{page}</span> / {totalPages} —
            Mỗi trang
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal form thêm/sửa xe */}
      <VehicleFormModal
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          setSelectedVehicle(null);
        }}
        initialData={selectedVehicle}
        onSubmit={handleSubmitVehicle}
      />
    </>
  );
}
