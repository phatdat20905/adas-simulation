import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import toast from "react-hot-toast";
import type { User } from "../../types";
import { getUsersAdmin, updateUser, deleteUser } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

// icons
import { Pencil, Trash2 } from "lucide-react";

export default function AdminUserManagement() {
  const { isOpen, openModal, closeModal } = useModal();

  // bảng dữ liệu
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // phân trang & lọc
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | "user" | "admin">("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [sort, setSort] = useState("-createdAt");

  // modal edit
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  // fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsersAdmin({ page, limit, search, role, active, sort });
      if (res.data.success) {
        setUsers(res.data.data ?? []);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      } else {
        toast.error(res.data.message || "Không thể tải danh sách người dùng");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, role, active, sort]);

  const resetToFirstPage = () => setPage(1);

  // events
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      active: user.active,
      image: user.image,
    } as Partial<User>);
    openModal();
  };

  const handleSave = async () => {
    try {
      if (!selectedUser) return;
      const res = await updateUser(selectedUser._id, formData);
      if (res.data.success) {
        toast.success("Cập nhật người dùng thành công");
        closeModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn vô hiệu hoá tài khoản này?")) return;
    try {
      const res = await deleteUser(id);
      if (res.data.success) {
        toast.success("Đã vô hiệu hoá tài khoản");
        fetchUsers();
      } else {
        toast.error(res.data.message || "Thao tác thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleQuickToggleActive = async (user: User) => {
    try {
      const res = await updateUser(user._id, { active: !user.active });
      if (res.data.success) {
        toast.success(`Đã ${!user.active ? "kích hoạt" : "vô hiệu hoá"} người dùng`);
        fetchUsers();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // UI
  return (
    <>
      <PageMeta title="User Managemnet | ADAS" description="Quản lý người dùng trong hệ thống" />
      <PageBreadcrumb pageTitle="Quản Lý Người Dùng" />
      <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Quản Lý Người Dùng</h2>
            <p className="text-gray-500 dark:text-gray-400">Quản lý tài khoản người dùng</p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Tổng: <span className="font-medium">{total}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <input
            type="text"
            placeholder="Tìm theo tên, email, sđt…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 md:col-span-2"
          />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as any);
              resetToFirstPage();
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value as any);
              resetToFirstPage();
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
            <option value="fullName">Tên (A-Z)</option>
            <option value="-fullName">Tên (Z-A)</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left">Avatar</th>
                <th className="px-4 py-2 text-left">Họ tên</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">SĐT</th>
                <th className="px-4 py-2 text-left">Địa chỉ</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Tạo lúc</th>
                <th className="px-4 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Đang tải…
                  </td>
                </tr>
              ) : users.length ? (
                users.map((u) => (
                  <tr key={u._id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">
                      <img
                        src={u.image || "/images/user/owner.jpg"}
                        alt={u.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-4 py-2">{u.fullName}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.phone}</td>
                    <td className="px-4 py-2">{u.address}</td>
                    <td className="px-4 py-2 capitalize">{u.role}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleQuickToggleActive(u)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          u.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="p-2 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Trang <span className="font-medium">{page}</span> / {totalPages} — Mỗi trang
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
              <option value={50}>50</option>
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

        {/* Modal Edit */}
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-xl m-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-gray-900 dark:text-gray-100">
            <h4 className="mb-4 text-xl font-semibold">Edit User</h4>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Full Name</Label>
                <Input name="fullName" type="text" value={formData.fullName || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" value={formData.email || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" type="text" value={formData.phone || ""} onChange={handleChange} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Input name="address" type="text" value={formData.address || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={formData.role || "user"}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={String(formData.active ?? true)}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === "true" })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
}
