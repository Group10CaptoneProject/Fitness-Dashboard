import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ReactTyped } from "react-typed";
import { Dumbbell } from "lucide-react";
import styles from "./Login.module.css";

// Local backend URL for development (port 8888)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8888";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Login failed. Please check your email and password."
        );
        return;
      }

      if (!data.access_token || !data.user_id) {
        setError("The server did not return the required login information.");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("username", data.username || "");

      navigate("/onboarding");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Could not connect to the backend. Check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-layout"]}>

        {/* Left blue section */}
        <section className={styles["hero-panel"]}>
          <div className={styles["home-logo"]}>
            <Link to ="/">
                <Dumbbell size={45} color="white" strokeWidth={2} />
                <span>Fitness Dashboard</span>
            </Link>
          </div>
          <div className={styles["hero-content"]}>
            <h1>
              See fatigue
              <br />
              before it builds.
            </h1>

            <p>
              Track recovery, fatigue, workload, and a single overall training
              score that helps you decide how hard to train today.
            </p>

            <p className="typed-text">
              <span className={styles["typed-label"]}>
                Training Tip:
              </span>{" "}
              <ReactTyped
                strings={[
                  "Recovery is just as important as training.",
                  "Sleep can affect your energy and workout performance.",
                  "Training too hard without enough recovery can increase fatigue.",
                  "Consistency matters more than one perfect workout.",
                  "Tracking your workload can help you train smarter.",
                  "Your readiness can change from day to day.",
                ]}
                typeSpeed={35}
                backSpeed={20}
                backDelay={1800}
                loop
              />
            </p>
          </div>
        </section>

        {/* Right login section */}
        <section className={styles["form-panel"]}>
          <div className={styles["login-card"]}>
            <h2>Welcome Back</h2>

            <p className={styles["subtitle"]}>
              Sign in to view your fitness dashboard.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              {error && (
                <p role="alert" style={{ color: "red" }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className={styles["form-links"]}>
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/register">Create account</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;