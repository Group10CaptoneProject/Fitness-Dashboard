import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { ChevronDown, Dumbbell, Menu, X, LogOut } from "lucide-react";
import styles from "./MainNavBar.module.css";

function MainNavBar({ username }) {
  const navigate = useNavigate();
  const [openAccountMenu, setOpenAccountMenu] = useState(false);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");

    navigate("/login", { replace: true });
  }
  
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
      
      <div className = {styles.account}>
        <button
          type="button"
          className={styles.userMenu}
          aria-label="User account"
          onClick={() => setOpenAccountMenu((open) => !open)}
        >
          {username}
          <ChevronDown size={21} />
        </button>
        {openAccountMenu && (
          <div className={styles.accountDropdown}>
            <button type="button" onClick={handleLogout}> 
              <span className={styles["logout-text"]}>Log out</span>
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default MainNavBar;