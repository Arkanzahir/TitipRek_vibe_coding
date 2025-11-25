// src/App.tsx - COMPLETE WITH ALL ROUTES
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { authService } from "./services/authService";

// Pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateOrder from "./pages/CreateOrder";
import OrderTracking from "./pages/OrderTracking";
import OrderHistory from "./pages/OrderHistory";
import RunnerActivation from "./pages/RunnerActivation";
import RunnerDashboard from "./pages/RunnerDashboard";
import RunnerProfile from "./pages/RunnerProfile";
import RunnerWithdrawal from "./pages/RunnerWithdrawal";
import MissionDetail from "./pages/MissionDetail";
import ConsumerProfile from "./pages/ConsumerProfile";
import Payment from "./pages/Payment";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    console.log("❌ Not authenticated");
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    console.log("❌ No user data");
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ ROBUST CHECK: Convert to string and check
  const rolesString = JSON.stringify(user.roles || []).toLowerCase();
  const hasAdminRole = rolesString.includes("admin");

  console.log("🔍 Admin Check:");
  console.log("  - User:", user.name);
  console.log("  - Roles:", user.roles);
  console.log("  - Has Admin?", hasAdminRole);

  if (!hasAdminRole) {
    console.log("❌ Access denied - Not an admin");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("✅ Admin access granted!");
  return <>{children}</>;
};

// Public Route (redirect to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Consumer */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-order"
          element={
            <ProtectedRoute>
              <CreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-tracking/:orderId"
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ConsumerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:orderId"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Runner */}
        <Route
          path="/runner-activation"
          element={
            <ProtectedRoute>
              <RunnerActivation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/runner-dashboard"
          element={
            <ProtectedRoute>
              <RunnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/runner-profile"
          element={
            <ProtectedRoute>
              <RunnerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/runner-withdrawal"
          element={
            <ProtectedRoute>
              <RunnerWithdrawal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission-detail/:orderId"
          element={
            <ProtectedRoute>
              <MissionDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
