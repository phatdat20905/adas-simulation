import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSupports, updateSupport, deleteSupport } from "../../services/api";
import type { Support } from "../../types";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { CheckCircle, Trash2 } from "lucide-react";

export default function AdminSupportPage() {
  const [supports, setSupports] = useState<Support[]>([]);
  const [loading, setLoading] = useState(false);

  // filters + pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | Support["status"]>(""); // pending, resolved
  const [sort, setSort] = useState("-createdAt");

  const fetchSupports = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        sort,
      };
      const res = await getSupports(params);
      if (res.data.success) {
        setSupports(res.data.data ?? []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
        setTotal(res.data.pagination?.total ?? 0);
      } else {
        toast.error(res.data.message || "Không thể tải danh sách hỗ trợ");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, status, sort]);

  const resetToFirstPage = () => setPage(1);

  const handleResolve = async (s: Support) => {
    try {
      const res = await updateSupport(s._id, { status: "resolved" });
      if (res.data.success) {
        toast.success("Đã đánh dấu đã xử lý");
        fetchSupports();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa hỗ trợ này?")) return;
    try {
      const res = await deleteSupport(id);
      if (res.data.success) {
        toast.success("Đã xóa hỗ trợ");
        if (supports.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchSupports();
      } else {
        toast.error(res.data.message || "Xóa thất bại");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <>
      <PageMeta title="Support Management | Admin" description="Quản lý yêu cầu hỗ trợ" />
      <PageBreadcrumb pageTitle="Support Management" />

      <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Support Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Quản lý yêu cầu hỗ trợ từ người dùng</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            type="text"
            placeholder="Tìm tên, email, subject..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetToFirstPage(); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 md:col-span-2"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as any); resetToFirstPage(); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); resetToFirstPage(); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <option value="-createdAt">Mới nhất</option>
            <option value="createdAt">Cũ nhất</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Tên</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Tiêu đề</th>
                <th className="px-4 py-2 text-left">Nội dung</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Ngày gửi</th>
                <th className="px-4 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">Đang tải…</td>
                </tr>
              ) : supports.length ? (
                supports.map((s) => (
                  <tr key={s._id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.email}</td>
                    <td className="px-4 py-2">{s.subject}</td>
                    <td className="px-4 py-2 truncate max-w-xs">{s.message}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${s.status === "resolved" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      {s.status !== "resolved" && (
                        <button
                          onClick={() => handleResolve(s)}
                          title="Mark as resolved"
                          className="p-2 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(s._id)}
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
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Trang <span className="font-medium">{page}</span> / {totalPages} — Tổng <span className="font-medium">{total}</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
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
      </div>
    </>
  );
}
