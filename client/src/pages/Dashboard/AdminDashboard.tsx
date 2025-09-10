import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, Users, Video, Activity } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import { getAdminDashboard } from "../../services/api";
import type { Simulation, AdminDashboard as AdminDashboardType } from "../../types";
import PageMeta from "../../components/common/PageMeta";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardType | null>(null);
  const [recentSimulations, setRecentSimulations] = useState<Simulation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAdminDashboard();
        if (res.data.success && res.data.data) {
          setStats(res.data.data);
          setRecentSimulations(res.data.data.recentSimulations);
        }
      } catch (err) {
        console.error("AdminDashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { title: "Vehicles", value: stats?.totalVehicles ?? 0, icon: Activity, color: "text-green-600" },
    { title: "Videos", value: stats?.totalVideos ?? 0, icon: Video, color: "text-indigo-600" },
    { title: "Simulations", value: stats?.totalSimulations ?? 0, icon: Shield, color: "text-orange-600" },
  ];

  return (
    <>
    <PageMeta
        title=" Admin Dashboard | ADAS -  Admin Dashboard Template"
        description="This is Admin Dashboard page for ADAS - Tailwind CSS Admin Dashboard Template"
      />
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl p-6 text-white shadow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="opacity-80">Overview of system activity and usage</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium">{stat.title}</h2>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Simulations by Status</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats?.statusDistribution ?? []}>
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Simulations */}
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Simulations</h2>
        <div className="space-y-3">
          {recentSimulations.map((s) => (
            <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-sm">{s.filename}</p>
                <p className="text-xs text-gray-500">User: {s.userId}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700">{s.status}</Badge>
                <span className="text-sm font-semibold">{s.result?.totalAlerts ?? 0} alerts</span>
              </div>
            </div>
          ))}
          {recentSimulations.length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent simulations</p>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
