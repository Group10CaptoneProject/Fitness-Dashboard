import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./History.module.css";
import {Circle, Logs } from "lucide-react";
import {useState , useEffect} from "react";

function History() {
    const username = localStorage.getItem("username") || "Username";
    const [historyData, setHistoryData] = useState([]);

    return (
        <>
        <MainNav username={username} />
            <main className = {styles["wrapper"]}>
                <header className = {styles["header"]}>
                    <h1>Workout History</h1>
                    <div className = {styles["description"]}>
                        <p>View your past workouts and progress</p>
                    </div>
                </header>

                <section className = {styles["log-section"]}>
                    <h2>
                        <span className = {styles["icon"]}>
                            <Logs size={22} />
                        </span>
                        Workout log
                    </h2>
                    <table className = {styles["table"]}>
                        <thead>
                            <th>Date</th>
                            <th>Workout Name</th>
                            <th>Workout Type</th>
                            <th>Target muscle</th>
                            <th>Duration</th>
                            <th>Difficulty</th>
                        </thead>
                    </table>
                </section>
            </main>

        </>
    );
}

export default History;