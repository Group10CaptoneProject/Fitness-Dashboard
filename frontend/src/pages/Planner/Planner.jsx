import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./Planner.module.css";
import {useState} from "react";
import {Search} from "lucide-react";

function Planner() {
  const username = localStorage.getItem("username") || "Username";
  const [selectedDay, setSelectedDay] = useState("Monday");

  return (
    <>
      <MainNav username={username} />
       <main className = {styles["wrapper"]}>
          <header className = {styles["header"]}>
            <h1>Workout Planner</h1>
            <div className = {styles["description"]}>
                <p>Build your custom workout plans. Search and add exercises to your routines.</p>
            </div>
          </header>
          <section>
            <div className = {styles["button-wrapper"]}>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Monday")}>
                Monday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Tuesday")}>
                Tuesday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Wednesday")}>
                Wednesday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Thursday")}>
                Thursday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Friday")}>
                Friday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Saturday")}>
                Saturday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Sunday")}>
                Sunday
              </button>
            </div>
          </section>
          <section className = {styles["search-section"]}>
            <h2>{selectedDay}'s Workouts</h2>
            <div className = {styles["search-bar"]}>
              <Search className={styles["search-icon"]} size={18} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search exercises"
                placeholder="Search exercises..."
              />
            </div>
          </section>
        </main>
    </>
  );
}

export default Planner;
