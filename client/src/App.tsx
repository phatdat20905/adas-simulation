import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { useAuth, AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import UserDashboard from "./pages/Dashboard/UserDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import UserProfiles from "./pages/UserProfiles";
import UserManagement from "./pages/Admin/UserManagement";
import VehicleManagement from "./pages/Admin/VehicleManagement";
import SupportManagement from "./pages/Admin/SupportManagement";
import Vehicle from "./pages/Vehicle";
import VideoUpload from "./pages/VideoUpload";
import Camera from "./pages/Camera";
import SimulationDetail from "./pages/SimulationDetail";
import SupportPage from "./pages/SupportPage";

function AppRoutes() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Routes>
      {/* HomePage chỉ cho khách */}
      <Route path="/" element={!user ? <HomePage /> : <Navigate to="/dashboard" />} />

      {/* Auth */}
      <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} />

      {/* Protected */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={user ? <UserDashboard /> : <Navigate to="/signin" />} />
        <Route path="/dashboard-admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />} />

        <Route path="/profile" element={user ? <UserProfiles /> : <Navigate to="/signin" />} />
        <Route path="/vehicle" element={user ? <Vehicle /> : <Navigate to="/signin" />} />
        <Route path="/video-upload" element={user ? <VideoUpload /> : <Navigate to="/signin" />} />
        <Route path="/camera" element={user ? <Camera /> : <Navigate to="/signin" />} />
        <Route path="/simulation-details/:id" element={user ? <SimulationDetail /> : <Navigate to="/signin" />} />
        <Route path="/support" element={user ? <SupportPage /> : <Navigate to="/signin" />} />

        <Route path="/user-management" element={isAdmin ? <UserManagement /> : <Navigate to="/" />} />
        <Route path="/vehicle-management" element={isAdmin ? <VehicleManagement /> : <Navigate to="/" />} />
        <Route path="/support-management" element={isAdmin ? <SupportManagement /> : <Navigate to="/" />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
