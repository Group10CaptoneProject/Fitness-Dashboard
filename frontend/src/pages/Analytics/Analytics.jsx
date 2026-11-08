import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./Analytics.module.css";
import { CalendarDays, Circle } from "lucide-react";
import analyticImg from "../../assets/analytics.webp";
import { useState, useEffect } from "react";
import IndividualChart from "./component/individualChart/individualChart";


function Analytics() {
    const username =
        localStorage.getItem("username") ||
        localStorage.getItem("user_name") ||
        localStorage.getItem("name") ||
        "Username";

    // Formatted current date: Weekday, Month Day, Year
    const today = new Date();

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = today.toLocaleDateString('en-US', options);

    const [scores, setScores] = useState([]);

    const [selectedDate, setSelectedDate] = useState("latest_seven");
    const handleDateSelect = (event) => {
        setSelectedDate(event.target.value);
    };

    useEffect(() =>{
        async function fetchTrainingData(){
            const token = localStorage.getItem("access_token")
            try{
                const reponse = await fetch("http://localhost:8888/dashboard/scores",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                const data = await reponse.json();
                if (selectedDate === "latest_seven") {
                    setScores(data.slice(-7));
                    return;
                } else if (selectedDate === "latest_thirty") {
                    setScores(data.slice(-30));
                    return;
                }

                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                if (selectedDate === "week") {
                    // Calendar weeks start on Monday.
                    const daysSinceMonday = (startDate.getDay() + 6) % 7;
                    startDate.setDate(startDate.getDate() - daysSinceMonday);
                } 
                else if (selectedDate === "month") {
                    startDate.setDate(1);
                }

                const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                const filteredData = data.filter((score) => {
                    // Parse calendar dates locally to avoid UTC shifting the day.
                    const [year, month, day] = String(score.score_date)
                        .slice(0, 10)
                        .split("-")
                        .map(Number);
                    const scoreDate = new Date(year, month - 1, day);

                    return scoreDate >= startDate && scoreDate < endDate;
                });

                setScores(filteredData);
            } catch (error) {
                console.error("Error fetching training data:", error);
            }
        }
        fetchTrainingData();
    },[selectedDate]);

    return (
        <>
            <MainNav username={username}/>
            <main className = {styles["wrapper"]}>
                <header className = {styles["header"]}>
                    <h1>Analyze Your Data</h1>
                    <div className = {styles["description"]}>
                        <p>Turn your progress into meaningful insights by comparing patterns, spotting changes, and understanding your progress over time.</p>
                        <div className = {styles["date"]}>
                            <CalendarDays size={24} aria-hidden="true" />
                            <time dateTime={new Date().toLocaleDateString("en-CA")}>
                                {formattedDate}
                            </time>
                        </div>
                    </div>
                </header>
                <section className={styles["training-banner"]} aria-labelledby="training-banner-title">
                    <img className={styles["banner-image"]} src={analyticImg} alt="Blue-lit gym with strength and cardio equipment" />
                    <div className={styles["banner-content"]}>
                        <span className={styles["banner-label"]}>
                            <Circle size={16} aria-hidden="true" /> DATA-DRIVEN TRAINING
                        </span>
                        <h2>With Knowledge , <br />Get result more effectively</h2>
                        <p>Train smarter, not harder.</p>
                    </div>
                </section>
                <section className={styles["chart-section"]}>
                    <h2>Training Trends</h2>
                    <div className={styles["selector-wrapper"]}>
                        <select
                            value = {selectedDate}
                            onChange = {handleDateSelect}
                        >   
                            <option value = "latest_seven" > Latest 7 days</option>
                            <option value = "latest_thirty" > Latest 30 days</option>
                            <option value = "week" > This Week</option>
                            <option value = "month" > This Month</option>
                        </select>

                    </div>
                    <IndividualChart scores={scores} />
                </section>
            </main>
        </>
    );
}

export default Analytics;
