import { useState } from "react";
import { Link, useNavigate } from "react-router";
import styles from "./Register.module.css";
import { Dumbbell } from "lucide-react";

// Local backend URL for development (port 8888)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8888";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim(),
          username: formData.username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.detail;

        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(" ")
          : typeof detail === "string"
            ? detail
            : "Registration failed. Please check your information.";

        setError(message);
        return;
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        "Could not connect to the backend. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles["register-page"]}>
      <div className={styles["register-layout"]}>
        <div className={styles["hero-panel"]}>
          <div className={styles["home-logo"]}>
            <Link to ="/">
                <Dumbbell size={45} color="white" strokeWidth={2} />
                <span>Fitness Dashboard</span>
            </Link>
          </div>
          <div className={styles["hero-content"]}>
            <h1>
              Start tracking.
              <br />
              Start improving.
            </h1>

            <p>
              Create your account to track recovery, fatigue, workload, and
              your overall training score.
            </p>
          </div>
        </div>

        <div className={styles["form-panel"]}>
          <div className={styles["register-card"]}>
            <h2>Create Account</h2>

            <p className={styles["subtitle"]}>
              Start your training journey today.
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles["form-group"]}>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  minLength={3}
                  maxLength={50}
                  autoComplete="username"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={100}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="first-name">First Name</label>
                <input
                  id="first-name"
                  name="first_name"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={handleChange}
                  maxLength={50}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="last-name">Last Name</label>
                <input
                  id="last-name"
                  name="last_name"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  maxLength={50}
                  autoComplete="family-name"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  maxLength={255}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="password-confirmation">
                  Password Confirmation
                </label>
                <input
                  id="password-confirmation"
                  name="confirm_password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  minLength={6}
                  maxLength={255}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <p role="alert" style={{ color: "red" }}>
                  {error}
                </p>
              )}

              {success && (
                <p role="status" style={{ color: "green" }}>
                  {success}
                </p>
              )}

              <button
                type="submit"
                className={styles["register-button"]}
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className={styles["login-text"]}>
              Already have an account?{" "}
              <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;