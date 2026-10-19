
import React from "react";
import { Dumbbell } from "lucide-react";
import styles from "./DailyEntry.module.css";

function DailyEntry() {
  return (
    <div>
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <Dumbbell size={38} strokeWidth={1.8} />
          <span className={styles.logoText}>Fitness Dashboard</span>
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
