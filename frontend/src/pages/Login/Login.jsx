import { Link } from "react-router";
import styles from "./Login.module.css";

function Login() {
  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-card"]}>
        <h1>Welcome Back</h1>

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

        <p className={styles["signup"]}>
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;