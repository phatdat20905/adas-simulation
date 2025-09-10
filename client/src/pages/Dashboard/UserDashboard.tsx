import { useEffect, useState } from "react";
import { Shield, Video, Activity } from "lucide-react";
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
    { title: "My Videos", value: stats?.myVideos ?? 0, icon: Video, color: "text-indigo-600" },
    { title: "My Simulations", value: stats?.mySimulations ?? 0, icon: Activity, color: "text-green-600" },
    { title: "My Alerts", value: stats?.myAlerts ?? 0, icon: Shield, color: "text-red-600" },
  ];

  return (
    <>
    <PageMeta
        title="Dashboard | ADAS - Dashboard Template"
        description="This is Dashboard page for ADAS - Tailwind CSS Admin Dashboard Template"
      />
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 text-white shadow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <p className="opacity-80">Personal overview of your ADAS activity</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Recent Simulations */}
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">My Recent Simulations</h2>
        <div className="space-y-3">
          {recentSimulations.map((s) => (
            <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-sm">{s.filename}</p>
                <p className="text-xs text-gray-500">{s.status}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">{s.result?.totalAlerts ?? 0} alerts</Badge>
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
