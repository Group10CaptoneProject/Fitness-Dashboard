
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Onboarding from "./pages/Onboarding/Onboarding";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import VerifyResetCode from "./pages/Auth/VerifyResetCode";
import ResetPassword from "./pages/Auth/ResetPassword";
import Landing from "./pages/Landing/Landing";
import Dashboard from "./pages/Dashboard/Dashboard";
import DailyEntry from "./pages/DailyEntry/DailyEntry";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/entry" element={<DailyEntry />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-code" element={<VerifyResetCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path ="/dashboard" element = {<Dashboard />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
