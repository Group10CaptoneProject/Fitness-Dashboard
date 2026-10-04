import { Link } from "react-router";
import styles from "./Login.module.css";
import { ReactTyped } from "react-typed";

function Login() {
  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-layout"]}>
        
        {/* Left blue section */}
        <section className={styles["hero-panel"]}>
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
            </span> 
            <ReactTyped
              strings={[
                "Recovery is just as important as training.",
                "Sleep can affect your energy and workout performance.",
                "Training too hard without enough recovery can increase fatigue.",
                "Consistency matters more than one perfect workout.",
                "Tracking your workload can help you train smarter.",
                "Your readiness can change from day to day."
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

            <form onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
              />

              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
              />

              <button type="submit">Sign In</button>
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