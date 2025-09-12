import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { Shield, Users, Video, Activity, Clock, Crown } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import { getAdminDashboard } from "../../services/api";
import type { Simulation, AdminDashboard as AdminDashboardType } from "../../types";
import PageMeta from "../../components/common/PageMeta";

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#dc2626"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAdminDashboard();
        if (res.data.success && res.data.data) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("AdminDashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "Users", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-blue-500" },
    { title: "Vehicles", value: stats?.totalVehicles ?? 0, icon: Activity, color: "bg-green-500" },
    { title: "Videos", value: stats?.totalVideos ?? 0, icon: Video, color: "bg-indigo-500" },
    { title: "Simulations", value: stats?.totalSimulations ?? 0, icon: Shield, color: "bg-orange-500" },
  ];

  const alertData = stats?.alertsByType
    ? Object.entries(stats.alertsByType).map(([key, value]) => ({ name: key, value }))
    : [];

  return (
    <>
      <PageMeta title="Admin Dashboard | ADAS" description="Admin Dashboard page for ADAS" />

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl p-6 text-white shadow flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="opacity-80">System-wide overview & insights</p>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Clock className="w-4 h-4" />
            Last update: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl shadow text-white ${stat.color} flex flex-col justify-between`}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium">{stat.title}</h2>
                <stat.icon className="h-6 w-6 opacity-80" />
              </div>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">Simulations by Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.statusDistribution ?? []}>
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alerts */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">Alerts by Type</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={alertData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {alertData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Trend */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">Simulations Trend (30 days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.trend30days ?? []}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Active Users */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Top Active Users
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Người dùng</th>
                <th className="p-2 text-left">Simulations</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topUsers?.map((u) => (
                <tr key={u.userId} className="border-b">
                  <td className="p-2">{u.fullName}</td>
                  <td className="p-2 font-semibold">{u.simulations}</td>
                </tr>
              ))}
              {(!stats?.topUsers || stats.topUsers.length === 0) && (
                <tr>
                  <td colSpan={2} className="text-center text-gray-500 py-4">
                    No active users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Simulations */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Simulations</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Filename</th>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentSimulations.map((s) => (
                <tr key={s._id} className="border-b">
                  <td className="p-2">{s.filename}</td>
                  <td className="p-2">{s.userId}</td>
                  <td className="p-2">
                    <Badge
                      className={
                        s.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : s.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-2">{s.result?.totalAlerts ?? 0}</td>
                </tr>
              ))}
              {(!stats?.recentSimulations || stats.recentSimulations.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-4">
                    No recent simulations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
