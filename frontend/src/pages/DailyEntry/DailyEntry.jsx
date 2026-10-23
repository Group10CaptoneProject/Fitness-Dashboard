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
import MainNav from "../../component/MainNavBar/MainNav";

function DailyEntry() {
  const navigate = useNavigate();
 
  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("user_name") ||
    localStorage.getItem("name") ||
    "Username";

  

  return (
    <div className={styles.page}>
      <MainNav username={username}></MainNav>
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