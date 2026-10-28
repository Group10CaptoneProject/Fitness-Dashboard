import styles from "./Dashboard.module.css";
import { useState, useEffect} from "react";
import {
    CalendarDays,
    Calendar,
    ChartSpline,
    NotebookText,
    Gauge as GaugeIcon,
    Activity,
} from "lucide-react";
import TrainingScoreCard from "./component/TrainingScoreCard/TrainingScoreCard";
import ReadinessScaleCard from "./component/ReadinessScaleCard/ReadinessScaleCard";
import SummaryCard from "./component/SummaryCard/SummaryCard";
import TrainingTrendCard from "./component/TrainingTrendCard/TrainingTrendCard";
import MainNav from "../../component/MainNavBar/MainNav";
import CalendarHM from "./component/CalendarHM/CalendarHM";


function Dashboard(){

    const [trainingScore, setTrainingScore] = useState(0);
    const [recoveryScore, setRecoveryScore] = useState(0);
    const [fatigueScore, setfatigueScore] = useState(0);
    const [workloadScore, setworkloadScore] = useState(0);
    const [weeklyScores, setWeeklyScores] = useState([]);
    const [heatMapData, setHeatMapData] = useState([]);

    useEffect(() =>{
        async function fetchDashboardData(){
            const token = localStorage.getItem("access_token")
            try{
                const reponse = await fetch("http://localhost:8888/dashboard/scores",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
    
                if (!reponse.ok){
                    throw new Error("Failed to fetch dashboard data");
                }
    
                const data = await reponse.json();
                const lastWeekData = data.slice(-7)
                setWeeklyScores(lastWeekData)
                setHeatMapData(
                    data.map((score) => ({
                        date: score.score_date,
                        count: 1,
                    }))
                );
                if (data.length > 0) {
                    const latestScore = data[data.length - 1];
    
                    setTrainingScore(
                        Number(latestScore.final_training_score)
                    );
    
                    setRecoveryScore(
                        Number(latestScore.recovery)
                    );
    
                    setfatigueScore(
                        Number(latestScore.fatigue)
                    );
    
                    setworkloadScore(
                        Number(latestScore.workload_balance_score)
                    );
                }

            }catch(error){
                console.error("Dashboard error:", error);

            }
        }
        fetchDashboardData();
    }, []);

    // Mock data for testing purposes
    // const [weeklyScores, setWeeklyScores] = useState([
    //     {
    //         score_date: "2026-10-10",
    //         recovery: 65,
    //         workload_balance_score: 55
    //     },
    //     {
    //         score_date: "2026-10-11",
    //         recovery: 72,
    //         workload_balance_score: 60
    //     },
    //     {
    //         score_date: "2026-10-12",
    //         recovery: 68,
    //         workload_balance_score: 70
    //     },
    //     {
    //         score_date: "2026-10-13",
    //         recovery: 80,
    //         workload_balance_score: 74
    //     },
    //     {
    //         score_date: "2026-10-14",
    //         recovery: 76,
    //         workload_balance_score: 68
    //     },
    //     {
    //         score_date: "2026-10-15",
    //         recovery: 85,
    //         workload_balance_score: 78
    //     },
    //     {
    //         score_date: "2026-10-16",
    //         recovery: 82,
    //         workload_balance_score: 84
    //     }
    // ]);

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
    return(
        <>
            <MainNav username={username}/>
            <div className = {styles["dashboard-wrapper"]}>
                <div className = {styles["dashboard-header"]}>
                    <div className = {styles["welcome-message"]}>
                        <h2>Hello, {username}</h2>
                    </div>
                    <div className = {styles["welcome-description"]}>
                        Here is your training status for today!
                        <div className = {styles["date"]}>
                            <CalendarDays size={24} />
                            {formattedDate}
                        </div>
                    </div>
                </div>
                {/* Full-width activity calendar */}
                <div className={`${styles["card"]} ${styles["calendar-card"]}`}>
                        <div className = {styles["card-header"]}>
                            <span className = {styles["tag"]}>
                                <Calendar size={24} color="white"/>
                            </span>
                            <div className = {styles["card-title"]}>
                                <h2>Activities</h2>
                            </div>
                        </div>
                        <CalendarHM data = {heatMapData}/>
                    </div>
                {/* Card sections */}
                <div className = {styles["card-wrapper"]}>
                    {/* Final training score */}
                    <div className={`${styles["card"]} ${styles["score-card"]}`}>
                        <div className = {styles["card-header"]}>
                            <span className = {styles["tag"]}>
                                <GaugeIcon size={24} color="white"/>
                            </span>
                            <div className = {styles["card-title"]}>
                                <h2>Final Training Score</h2>
                            </div>
                        </div>
                        <TrainingScoreCard score = {trainingScore}/>
                    </div>
                    {/* Readiness scale */}
                    <div className={`${styles["card"]} ${styles["score-card"]} ${styles["readiness-card"]}`}>
                        <div className = {styles["card-title"]}>
                            <div className = {styles["card-header"]}>
                                <span className = {styles["tag"]}>
                                    <Activity size={24} color="white"/>
                                </span>
                                <div className = {styles["card-title"]}>
                                    <h2>Readiness Scale</h2>
                                </div>
                            </div>
                            <ReadinessScaleCard score = {trainingScore} />
                        </div>
                    </div>

                    {/* Training trend (7 days) */}
                    <div className={`${styles["card"]} ${styles["trend-card"]}`}>
                        <div className = {styles["card-title"]}>
                            <div className = {styles["card-header"]}>
                                <span className = {styles["tag"]}>
                                    <ChartSpline size={24} color="white"/>
                                </span>
                                <div className = {styles["card-title"]}>
                                    <h2>Past 7 Day Training Trend</h2>
                                </div>
                            </div>
                        </div>
                        <TrainingTrendCard scores={weeklyScores} />
                    </div >
                    {/* Today's summary */}
                    <div className={`${styles["card"]} ${styles["summary-card"]}`}>
                        <div className = {styles["card-title"]}>
                            <div className = {styles["card-header"]}>
                                <span className = {styles["tag"]}>
                                    <NotebookText size={24} color="white"/>
                                </span>
                                <div className = {styles["card-title"]}>
                                    <h2>Today's Summary</h2>
                                </div>
                            </div>
                            <SummaryCard
                                finalScore = {trainingScore}
                                recoveryScore = {recoveryScore}
                                fatigueScore = {fatigueScore}
                                workloadBalanceScore = {workloadScore}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
export default Dashboard;
