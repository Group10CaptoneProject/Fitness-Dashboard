import styles from "./NavigateBar.module.css";
import { Link } from "react-router";
import { Dumbbell } from "lucide-react";

function NavBar() {
  return (
    <nav className={styles["nav-bar"]}>
      <div className ={styles["logo"]}>
        <Link to="/">
          <span>Fitness Dashboard</span>
        </Link>
      </div>

      <div className={styles["nav-links"]}>
        <Link to="/about">
          <span>About</span>
        </Link>

        <Link to="/features">
          <span>Features</span>
        </Link>

        <Link to="/functionality">
          <span>Functionality</span>
        </Link>

        <Link to="/contact">
          <span>Contact</span>
        </Link>

      </div>

      <div className={styles["nav-buttons"]}>
        <Link to="/login">
          <button className={styles["login-button"]}>
            Login
          </button>
        </Link>

        <Link to="/register">
          <button className={styles["register-button"]}>
            Register
          </button>
        </Link>
      </div>

    </nav>
  );
}

export default NavBar;