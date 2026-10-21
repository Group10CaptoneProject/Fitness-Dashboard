import { Routes, Route } from "react-router";
import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Onboarding from "../pages/Onboarding/Onboarding";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import VerifyResetCode from "../pages/Auth/VerifyResetCode";
import ResetPassword from "../pages/Auth/ResetPassword";
import NotFound from "../pages/NotFound/NotFound";
import Dashboard from "../pages/Dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={ <Login />}/>
      <Route path="/register" element={<Register />}/>
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>}/>

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-code" element={<VerifyResetCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;