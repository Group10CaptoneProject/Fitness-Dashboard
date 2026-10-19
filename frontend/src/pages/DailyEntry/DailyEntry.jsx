import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Dumbbell, ChevronDown, LogOut } from "lucide-react";
import styles from "./DailyEntry.module.css";

function DailyEntry() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedName =
      localStorage.getItem("user_name") ||
      localStorage.getItem("username") ||
      localStorage.getItem("name");

    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // Close the dropdown when clicking outside.
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleOnboardingClick() {
    setDropdownOpen(false);
    navigate("/onboarding");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
  
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <Dumbbell size={32} strokeWidth={1.8} />
          <span className={styles.logoText}>Fitness Dashboard</span>
        </div>

        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            type="button"
            className={styles.userMenuButton}
            onClick={() => setDropdownOpen((previous) => !previous)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Open user menu"
          >
            <span className={styles.userName}>{userName}</span>
            <ChevronDown
              size={18}
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
                onClick={handleOnboardingClick}
              >
                Back to Onboarding
              </button>

              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        <div>
          <h1>Daily Entry</h1>
          <p>
            Tell us how you are feeling and what you trained today
          </p>
        </div>
      </main>
    </div>
  );
}

export default DailyEntry;