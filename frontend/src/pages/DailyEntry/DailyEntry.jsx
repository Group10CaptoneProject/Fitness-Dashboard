import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Dumbbell,
  NotebookPen,
  LayoutDashboard,
  CalendarDays,
  ChevronDown,
  LogOut,
  UserRoundPen,
} from "lucide-react";
import styles from "./DailyEntry.module.css";

function DailyEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("user_name") ||
    localStorage.getItem("name") ||
    "Username";

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNavigation(path) {
    setDropdownOpen(false);
    navigate(path);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("username");
    localStorage.removeItem("name");

    setDropdownOpen(false);
    navigate("/login", { replace: true });
  }

  const navItems = [
    { label: "Daily Entry", path: "/entry", Icon: NotebookPen },
    { label: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
    { label: "Training Plan", path: "/training-plan", Icon: CalendarDays },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <button
          type="button"
          className={styles.logo}
          onClick={() => handleNavigation("/entry")}
          aria-label="Go to Daily Entry"
        >
          <Dumbbell size={30} />
          <span className={styles.logoText}>Fitness Dashboard</span>
        </button>

        <nav className={styles.navLinks} aria-label="Main navigation">
          {navItems.map(({ label, path, Icon }) => {
            const active = location.pathname === path;

            return (
              <button
                key={path}
                type="button"
                className={`${styles.navButton} ${
                  active ? styles.activeNavButton : ""
                }`}
                onClick={() => handleNavigation(path)}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.userMenuContainer} ref={dropdownRef}>
          <button
            type="button"
            className={styles.userMenuButton}
            onClick={() => setDropdownOpen((previous) => !previous)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className={styles.userName}>{username}</span>
            <ChevronDown
              size={20}
              className={`${styles.chevron} ${
                dropdownOpen ? styles.chevronOpen : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => handleNavigation("/onboarding")}
              >
                <UserRoundPen size={16} />
                Edit Onboarding Information
              </button>
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heading}>
          <h1>Daily Entry</h1>
          <p>Tell us how you are feeling and what you trained today.</p>
        </div>
      </main>
    </div>
  );
}

export default DailyEntry;