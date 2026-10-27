import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  UserRoundPen,
  Menu,
  X,
  LineChart,
  User
} from "lucide-react";
import styles from "./MainNav.module.css";

function MainNav({ username }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close the username dropdown when clicking outside it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    { label: "Analytics", path: "/analytics", Icon: LineChart },
  ];

  const currentPath = location.pathname.replace(/\/+$/, "") || "/";

  // For hamburger menu
  const [openMenu, setOpen] = useState(false)
    
  function handleHamburgerClick() {
    setOpen((previous) => !previous);
  }


  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <button
        type="button"
        className={styles.logo}
        onClick={() => handleNavigation("/entry")}
        aria-label="Go to Daily Entry"
      >
        <Dumbbell size={30} strokeWidth={1.8} />
        <span className={styles.logoText}>Fitness Dashboard</span>
      </button>

      <div className={styles.navLinks}>
        {navItems.map(({ label, path, Icon }) => {
          const itemPath = path.replace(/\/+$/, "") || "/";
          const isActive =
            currentPath === itemPath ||
            currentPath.startsWith(`${itemPath}/`);

          return (
            <button
              key={path}
              type="button"
              className={`${styles.navButton} ${
                isActive ? styles.activeNavButton : ""
              }`}
              onClick={() => handleNavigation(path)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Hamburger menu */}
      
      {/* Hamburger menu */}
      <button
        type="button"
        className={styles.hamburgerMenu}
        onClick={handleHamburgerClick}
        aria-expanded={openMenu}
        aria-label="Toggle navigation menu"
      >
        {openMenu? <X/> :<Menu />}
      </button>

      {openMenu && (
        <div className={styles.mobileNavLinks}>
          {navItems.map(({ label, path, Icon }) => {
            const itemPath = path.replace(/\/+$/, "") || "/";
            const isActive =
              currentPath === itemPath ||
              currentPath.startsWith(`${itemPath}/`);

            return (
              <button
                key={path}
                type="button"
                className={`${styles.mobileNavButton} ${
                  isActive ? styles.activeMobileNavButton : ""
                }`}
                onClick={() => {
                  handleNavigation(path);
                  setOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
  

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
              onClick={() => handleNavigation("/profile")}
            >
              <User size={16} />
              <span>Profile</span>
            </button>
            
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => handleNavigation("/onboarding")}
            >
              <UserRoundPen size={16} />
              <span>Edit Onboarding Information</span>
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
    </nav>
  );
}

export default MainNav;