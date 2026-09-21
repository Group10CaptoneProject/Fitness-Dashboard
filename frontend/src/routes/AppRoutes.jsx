import { Routes, Route, Navigate } from "react-router";
import Login from "../pages/Login/Login";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default AppRoutes;