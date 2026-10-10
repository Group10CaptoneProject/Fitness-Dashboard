import { Link } from "react-router";
import styles from "./Register.module.css";
import { Dumbbell } from "lucide-react";

function Register() {
  return (
    <div className={styles["register-page"]}>
      <div className={styles["register-layout"]}>

        {/* Left side */}
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

        {/* Right side */}
        <div className={styles["form-panel"]}>
          <div className={styles["register-card"]}>

            <h2>Create Account</h2>

            <p className={styles["subtitle"]}>
              Start your training journey today.
            </p>

            <form>

              {/* Username */}
              <div className={styles["form-group"]}>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                />
              </div>

              {/* Email */}
              <div className={styles["form-group"]}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* First name */}
              <div className={styles["form-group"]}>
                <label htmlFor="first-name">First Name</label>
                <input
                  id="first-name"
                  type="text"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              {/* Last name */}
              <div className={styles["form-group"]}>
                <label htmlFor="last-name">Last Name</label>
                <input
                  id="last-name"
                  type="text"
                  placeholder="Enter your last name"
                  required
                />
              </div>

              {/* Password */}
              <div className={styles["form-group"]}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  required
                />
              </div>

              {/* Password confirmation */}
              <div className={styles["form-group"]}>
                <label htmlFor="password-confirmation">
                  Password Confirmation
                </label>
                <input
                  id="password-confirmation"
                  type="password"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                className={styles["register-button"]}
              >
                Create Account
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