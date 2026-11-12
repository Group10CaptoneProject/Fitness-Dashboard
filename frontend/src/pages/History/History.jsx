import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./History.module.css";
import { Logs } from "lucide-react";
import {useState , useEffect} from "react";

function History() {
    const username = localStorage.getItem("username") || "Username";
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() =>{
        async function fetchHistory() {
            try {
                const apiBase = (process.env.REACT_APP_API_URL || "http://localhost:8888").replace(/\/$/, "");
                const response = await fetch(`${apiBase}/entries/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch history data (${response.status})`);
                }

                const data = await response.json();
                if (!Array.isArray(data)) throw new Error("Unexpected history response: expected a list of entries.");
                setHistoryData(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, []);

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
                          <tr>
                            <th>Date</th>
                            <th>Workout Name</th>
                            <th>Workout Type</th>
                            <th>Target muscle</th>
                            <th>Duration</th>
                            <th>Difficulty</th>
                          </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={6}>Loading workout history…</td></tr>}
                            {!loading && error && <tr><td colSpan={6} role="alert">{error}</td></tr>}
                            {!loading && !error && historyData.length === 0 && (
                                <tr><td colSpan={6}>No saved workouts yet.</td></tr>
                            )}
                            {historyData.map((entry) => (
                                <tr key={entry.entry_id}>
                                    <td>{entry.entry_date}</td>
                                    <td>{entry.exercise_name}</td>
                                    <td>{entry.muscle_category}</td>
                                    <td>{entry.muscle_group}</td>
                                    <td>{entry.duration} mins</td>
                                    <td>{entry.difficulty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </main>

        </>
    );
}

export default History;
