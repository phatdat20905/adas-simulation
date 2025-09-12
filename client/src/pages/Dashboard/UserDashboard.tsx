import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Shield, Video, Activity, Clock } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import { getUserDashboard } from "../../services/api";
import type { Simulation, UserDashboard as UserDashboardType } from "../../types";
import PageMeta from "../../components/common/PageMeta";

export default function UserDashboard() {
  const [stats, setStats] = useState<UserDashboardType | null>(null);
  const [recentSimulations, setRecentSimulations] = useState<Simulation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getUserDashboard();
        if (res.data.success && res.data.data) {
          setStats(res.data.data);
          setRecentSimulations(res.data.data.recentSimulations);
        }
      } catch (err) {
        console.error("UserDashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "My Videos", value: stats?.myVideos ?? 0, icon: Video, color: "bg-indigo-500" },
    { title: "My Simulations", value: stats?.mySimulations ?? 0, icon: Activity, color: "bg-green-500" },
    { title: "My Alerts", value: stats?.myAlerts ?? 0, icon: Shield, color: "bg-red-500" },
  ];

  return (
    <>
      <PageMeta title="User Dashboard | ADAS" description="User Dashboard page for ADAS" />

      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 text-white shadow flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="opacity-80">Personal overview of your ADAS activity</p>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Clock className="w-4 h-4" />
            Last update: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, idx) => (
            <div key={idx} className={`p-5 rounded-xl shadow text-white ${stat.color}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium">{stat.title}</h2>
                <stat.icon className="h-6 w-6 opacity-80" />
              </div>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Trends */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">My Simulation Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.trend7days ?? []}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">My Alerts Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.alertsTrend ?? []}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div> */}

        {/* Recent Simulations */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">My Recent Simulations</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Filename</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {recentSimulations.map((s) => (
                <tr key={s._id} className="border-b">
                  <td className="p-2">{s.filename}</td>
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
              {recentSimulations.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-4">
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
