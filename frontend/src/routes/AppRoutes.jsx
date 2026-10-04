import { Routes, Route, Navigate } from "react-router";
import Login from "../pages/Login/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import VerifyResetCode from "../pages/Auth/VerifyResetCode";
import NotFound from "../pages/NotFound/NotFound";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-code" element={<VerifyResetCode />} />
      <Route path ="*" element={<NotFound/>}/>
    </Routes>
  );
}

export default AppRoutes;