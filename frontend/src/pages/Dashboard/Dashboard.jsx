import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8888";

function Dashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      if (!userId || !token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [dashboardResponse, scoresResponse] = await Promise.all([
          fetch(`${API_URL}/dashboard/${userId}`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_URL}/dashboard/${userId}/scores`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        const dashboardData = await dashboardResponse.json();
        const scoresData = await scoresResponse.json();

        if (
          dashboardResponse.status === 401 ||
          dashboardResponse.status === 403 ||
          scoresResponse.status === 401 ||
          scoresResponse.status === 403
        ) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("username");
          navigate("/login", { replace: true });
          return;
        }

        if (!dashboardResponse.ok) {
          throw new Error(
            typeof dashboardData.detail === "string"
              ? dashboardData.detail
              : "Could not load dashboard data."
          );
        }

        if (!scoresResponse.ok) {
          throw new Error(
            typeof scoresData.detail === "string"
              ? scoresData.detail
              : "Could not load daily scores."
          );
        }

        setDashboard(dashboardData);
        setScores(scoresData);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Dashboard error:", err);
          setError(err.message || "Could not connect to the backend.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");

    navigate("/login", { replace: true });
  }

  if (loading) {
    return <p>Loading your fitness dashboard...</p>;
  }

  if (error) {
    return (
      <main>
        <p role="alert">{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </main>
    );
  }

  if (!dashboard) {
    return <p>No dashboard data is available.</p>;
  }

  const profile = dashboard.user_profile;
  const entries = dashboard.entries || [];
  const readiness = dashboard.readiness_summary || [];

  return (
    <main style={{ padding: "24px", maxWidth: "1000px", margin: "auto" }}>
      <header>
        <h1>
          Welcome,{" "}
          {profile?.first_name ||
            localStorage.getItem("username") ||
            "Athlete"}
        </h1>

        <p>Here is your recent training activity.</p>

        <button onClick={handleLogout}>Log Out</button>
      </header>

      <section>
        <h2>Profile</h2>

        {profile ? (
          <p>
            {profile.first_name} {profile.last_name}
          </p>
        ) : (
          <p>You have not created your user profile yet.</p>
        )}

        <p>
          Fitness profiles:{" "}
          {dashboard.fitness_profile?.length ?? 0}
        </p>
      </section>

      <section>
        <h2>Recent Workout Entries</h2>

        {entries.length === 0 ? (
          <p>No workout entries found.</p>
        ) : (
          entries.map((entry, index) => (
            <article
              key={`${entry.entry_date}-${index}`}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <h3>{String(entry.entry_date)}</h3>
              <p>Sleep: {entry.sleep ?? "N/A"}</p>
              <p>Energy level: {entry.energy_level ?? "N/A"}</p>
              <p>Soreness: {entry.soreness ?? "N/A"}</p>
              <p>Stress: {entry.stress ?? "N/A"}</p>
              <p>Heart rate: {entry.heart_rate ?? "N/A"}</p>
              <p>Exercise: {entry.exercise_name ?? "N/A"}</p>
              <p>Duration: {entry.duration ?? "N/A"}</p>
              <p>Difficulty: {entry.difficulty ?? "N/A"}</p>
            </article>
          ))
        )}
      </section>

      <section>
        <h2>Readiness Summary</h2>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {JSON.stringify(readiness, null, 2)}
        </pre>
      </section>

      <section>
        <h2>Daily Scores</h2>

        {scores.length === 0 ? (
          <p>No daily scores are available yet.</p>
        ) : (
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {JSON.stringify(scores, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}

export default Dashboard;