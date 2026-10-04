import { Link } from "react-router";
import styles from "./auth.module.css";

function ResetPassword() {
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

            <form onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your new password"
                required
              />

              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                required
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