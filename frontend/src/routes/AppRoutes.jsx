import { Routes, Route, Navigate } from "react-router";
import Login from "../pages/Login/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import VerifyResetCode from "../pages/Auth/VerifyResetCode";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-code" element={<VerifyResetCode />} />
    </Routes>
  );
}

export default AppRoutes;