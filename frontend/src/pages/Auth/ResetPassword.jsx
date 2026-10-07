import { Link ,useNavigate } from "react-router";
import { useState } from "react";
import styles from "./auth.module.css";


function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword){
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const resetToken = sessionStorage.getItem("resetToken");
    try {
      const response = await fetch("http://localhost:8888/auth/reset-password",{
          method: "POST",
          headers: {"Content-Type": "application/json",},
          body: JSON.stringify({ 
            reset_token: resetToken,
            new_password: password,
            confirm_password: confirmPassword }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.detail || "Unable to reset password");
        return;
      }
      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("resetEmail")
      navigate("/login");
  
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-layout"]}>
        {/* Left section */}
        <section className={styles["hero-panel"]}>
          <div className={styles["hero-content"]}>
            <p>STEP 3 OF 3</p>
            <h1>RESET YOUR PASSWORD.</h1>

            <div>
              <p>Create a new password for your account.</p>
              <p>Choose a strong password to keep your account secure.</p>
            </div>

            {/* Progress */}
            <div className={styles["progress"]}>
              <div></div>
              <div></div>
              <div className={styles["progress-active"]}></div>
            </div>
          </div>
        </section>

        {/* Right section */}
        <section className={styles["form-panel"]}>
          <div className={styles["card"]}>
            <h2>Reset Password</h2>

            <p className={styles["subtitle"]}>
              Enter your new password below to reset your account password.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your new password"
                required
                value={password}
                onChange={(e)=> setPassword(e.target.value)}
              />

              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                required
                value={confirmPassword}
                onChange={(e)=> setConfirmPassword(e.target.value)}
              />

              <button type="submit">Reset Password</button>
            </form>

            <div className={styles["form-links"]}>
              <Link to="/login">Back to login</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ResetPassword;