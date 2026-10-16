import styles from "./NavigateBar.module.css";
import { Link } from "react-router";
import { Dumbbell } from "lucide-react";

function NavBar() {
  return (
    <nav className={styles["nav-bar"]}>
      <div className ={styles["logo"]}>
        <a href="#">
          <span className={styles["animated-word"]}>
              <span>F</span>
              <span>D</span>
          </span>
          <span> : </span>
          <span>Fitness Dashboard</span>
        </a>
      </div>
      <div className={styles["home-logo"]}>
        <Link to ="/">
            <Dumbbell size={30} color="black" strokeWidth={2} />
        </Link>
      </div>
      <div className={styles["nav-links"]}>
        <a href="#about">
          <span>About</span>
        </a>

        <a href="#features">
          <span>Features</span>
        </a>

        <a href="#snippet">
          <span>Snippet</span>
        </a>

        <a href="/#contact">
          <span>Contact</span>
        </a>

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