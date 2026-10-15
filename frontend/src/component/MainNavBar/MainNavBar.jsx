import { Link } from "react-router";
import { ChevronDown, Dumbbell, Menu, X } from "lucide-react";
import styles from "./MainNavBar.module.css";

function MainNavBar({ username }) {

  
  return (
    <nav className={styles.navbar}>
      <div className={styles["link-wrapper"]}>
        <div className={styles.logo}>
          <Dumbbell size={38} strokeWidth={1.8} />
          <span className={styles.logoText}>Fitness Dashboard</span>
        </div>

        <div className={styles["nav-links"]}>
          <Link to="/daily-entry">Daily Entry</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/training-plan">Training Plan</Link>
        </div>
      </div>
      

      <button
        type="button"
        className={styles.userMenu}
        aria-label="User account"
      >
        {username}
        <ChevronDown size={21} />
      </button>
    </nav>
  );
}

export default MainNavBar;