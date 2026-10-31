import styles from "./Dashboard.module.css";
import { useState, useEffect} from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    Calendar,
    ChartSpline,
    NotebookText,
    Gauge as GaugeIcon,
    Activity,
    HeartPulse,
    BatteryLow,
    Scale,
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
                    <div id="training-trend" className={`${styles["card"]} ${styles["trend-card"]}`}>
                        <div className = {styles["card-title"]}>
                            <div className = {styles["card-header"]}>
                                <span className = {styles["tag"]}>
                                    <ChartSpline size={24} color="white"/>
                                </span>
                                <div className = {styles["card-title"]}>
                                    <h2>Latest 7 Day Training Trend</h2>
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
                {/* Section with guides to help users that just landed */}
                <section className={styles.guideSection} aria-labelledby="getting-started-title">
                    <h2 id="getting-started-title">
                        Confused about where to start?
                    </h2>
                    <p>
                        Here is how the workflow will look like. A step by step guide walking you through your first entry.
                    </p>
                    <ol className={styles.guideSteps}>
                        {[
                            { title: "Complete Daily Entry", description: "Log sleep, energy, soreness, stress, heart rate, and workout information.", label: "Start check-in", to: "/entry" },
                            { title: "See Your Results", description: "Your dashboard turns your check-in into recovery, fatigue, workload, and training scores.", label: "View dashboard", to: "/dashboard" },
                            { title: "Follow Your Plan", description: "Use readiness and recent training scores to guide your weekly workout intensity.", label: "Open training plan", to: "/training-plan" },
                            { title: "Explore Analytics", description: "Review recent trends and understand how your training changes over time.", label: "View training trends", to: "#training-trend" },
                        ].map((step, index) => (
                            <li key={step.title} className={styles.guideStep}>
                                <h3>{index + 1} . {step.title}</h3>
                                <p>{step.description}</p>
                                {step.to.startsWith("#") ? (
                                    <a href={step.to}>{step.label} <span aria-hidden="true">→</span></a>
                                ) : (
                                    <Link to={step.to}>{step.label} <span aria-hidden="true">→</span></Link>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>
                {/* A lil section that explains more of what the scores mean */}
                <section>
                    <h2>
                         What does each score mean?
                    </h2>
                    <div className={styles.viewResearch}>
                        <p>
                            You may be wondering what each score represents. This section provides a
                            clear summary of each. Click view research for more in-depth explainations.
                        </p>
                        <Link to = "/research"><span>View Research → </span></Link>
                    </div>
                    <div className={styles.scoreOverview}>
                        {[
                            { title: "Training Score", Icon: GaugeIcon, theme: "blue", description: "An overview of your training readiness, based on the combination of your subscores" },
                            { title: "Recovery", Icon: HeartPulse, theme: "green", description: " Sleep has the largest influence, followed by energy. More sleep and energy, with less soreness and stress, raise this score. The recovery represents how well you rested." },
                            { title: "Fatigue", Icon: BatteryLow, theme: "purple", description: "Reflects the soreness and stress you reported in your latest check-in. Fatigue measures the exhaustion from each workout session." },
                            { title: "Workload Balance", Icon: Scale, theme: "orange", description: "Represents the training load of your logged workout by combining its duration and difficulty. It measures the session load, longer or harder sessions increase this value." },
                        ].map(({ title, Icon, theme, description }) => (
                            <div key={title} className={`${styles.scoreOverviewCard} ${styles[theme]}`}>
                                <div className={styles.scoreOverviewIcon}>
                                    <Icon size={160} strokeWidth={1.25} stroke={`url(#score-icon-${theme})`} aria-hidden="true">
                                        <defs>
                                            <linearGradient id={`score-icon-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="var(--score-accent)" />
                                                <stop offset="100%" stopColor="var(--score-accent-end)" />
                                            </linearGradient>
                                        </defs>
                                    </Icon>
                                </div>
                                <div className={styles.scoreOverviewContent}>
                                    <h3>{title}</h3>
                                    <p>{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    )
}
export default Dashboard;   
