import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import VideoUploadForm from "../components/video/VideoUploadForm";
import VideoList from "../components/video/VideoList";
import type { Simulation, Vehicle } from "../types";
import { getSimulations, deleteSimulation } from "../services/api";
import { getUserVehicles } from "../services/api";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

export default function VideoUploadPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      const res = await getSimulations(page, limit);
      if (res.data.success) {
        const payload = res.data.data ?? (res.data as any);
        // support both shapes: { simulations, totalPages, totalItems } or { data: { simulations... } }
        const sims = (payload.simulations ?? (res.data as any).simulations) as Simulation[] | undefined;
        if (sims) setSimulations(sims);
        setTotalPages(payload.totalPages ?? (res.data as any).totalPages ?? 1);
      } else {
        toast.error(res.data.message || "Không thể tải danh sách video");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await getUserVehicles({ page: 1, limit: 1000 });
      if (res.data.success) {
        setVehicles(res.data.data ?? []);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchSimulations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onUploadSuccess = (newSimulation?: Simulation) => {
    toast.success("Upload thành công, simulation đã được tạo");
    // refresh list (prefer keep current page)
    fetchSimulations();
    // optionally push newly created to top
    if (newSimulation) {
      setSimulations((prev) => [newSimulation, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bản mô phỏng này?")) return;
    try {
      const res = await deleteSimulation(id);
      if (res.data.success) {
        toast.success("Đã xóa simulation");
        // reload
        if (simulations.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchSimulations();
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
      <PageMeta title="Upload Video" description="Quản lý xe của tôi" />
      <PageBreadcrumb pageTitle="Upload Video" />

      <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Video Upload & ADAS</h2>
            <p className="text-gray-600 dark:text-gray-400">Tải video hoặc camera trực tiếp để phân tích ADAS.</p>
          </div>
        </div>

        <VideoUploadForm vehicles={vehicles} onUploadSuccess={onUploadSuccess} />

        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Video / Simulations</h3>
          <VideoList
            simulations={simulations}
            loading={loading}
            onRefresh={fetchSimulations}
            onDelete={handleDelete}
            page={page}
            totalPages={totalPages}
            onPageChange={(p: number) => setPage(p)}
          />
        </div>
      </div>
    </>
  );
}
