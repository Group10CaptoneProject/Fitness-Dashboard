import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./Planner.module.css";

function Planner() {
  const username = localStorage.getItem("username") || "Username";

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
              <button className = {styles["button"]}>Monday</button>
              <button className = {styles["button"]}>Tuesday</button>
              <button className = {styles["button"]}>Wednesday</button>
              <button className = {styles["button"]}>Thursday</button>
              <button className = {styles["button"]}>Friday</button>
              <button className = {styles["button"]}>Saturday</button>
              <button className = {styles["button"]}>Sunday</button>
            </div>
          </section>
        </main>
    </>
  );
}

export default Planner;
