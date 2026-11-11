import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { isAuthenticated } from "../auth/auth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8888"
).replace(/\/+$/, "");

// status: "checking" | "ok" | "needs_onboarding" | "expired"
function ProtectedRoute({ children, requireOnboarding = true }) {
  const authenticated = isAuthenticated();

  const [status, setStatus] = useState(
    requireOnboarding ? "checking" : "ok"
  );

  useEffect(() => {
    if (!authenticated || !requireOnboarding) return;

    let cancelled = false;

    async function checkOnboarding() {
      const token = localStorage.getItem("access_token");

      try {
        const response = await fetch(`${API_URL}/profile/onboarding-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        if (response.status === 401 || response.status === 403) {
          setStatus("expired");
          return;
        }

        if (!response.ok) {
          // Backend problem: let the page load; the backend still protects the data.
          setStatus("ok");
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setStatus(data.is_onboarded === true ? "ok" : "needs_onboarding");
        }
      } catch (err) {
        console.error("Could not check onboarding status:", err);
        if (!cancelled) setStatus("ok");
      }
    }

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [authenticated, requireOnboarding]);

  if (!authenticated || status === "expired") {
    return <Navigate to="/login?reason=expired" replace />;
  }

  if (status === "checking") {
    return null; // or a spinner
  }

  if (status === "needs_onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default ProtectedRoute;