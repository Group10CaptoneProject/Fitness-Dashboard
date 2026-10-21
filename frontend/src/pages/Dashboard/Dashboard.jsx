import styles from "./Dashboard.module.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
    CalendarDays,
    ChartSpline,
    NotebookText,
    Gauge as GaugeIcon,
    Activity,
    Dumbbell,
    NotebookPen,
    LayoutDashboard,
    ChevronDown,
    LogOut,
    UserRoundPen,
} from "lucide-react";
import TrainingScoreCard from "./component/TrainingScoreCard/TrainingScoreCard";
import ReadinessScaleCard from "./component/ReadinessScaleCard/ReadinessScaleCard";
import SummaryCard from "./component/SummaryCard/SummaryCard";
import TrainingTrendCard from "./component/TrainingTrendCard/TrainingTrendCard";

function Dashboard(){
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [trainingScore, setTrainingScore] = useState(0);
    const [recoveryScore, setRecoveryScore] = useState(0);
    const [fatigueScore, setfatigueScore] = useState(0);
    const [workloadScore, setworkloadScore] = useState(0);
    const [weeklyScores, setWeeklyScores] = useState([]);

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

    // Close the username dropdown when clicking outside it.
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

    function handleNavigation(path) {
        setDropdownOpen(false);
        navigate(path);
    }

    function handleLogout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("username");
        localStorage.removeItem("name");

        setDropdownOpen(false);
        navigate("/login", { replace: true });
    }

    const navItems = [
        { label: "Daily Entry", path: "/entry", Icon: NotebookPen },
        { label: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
        { label: "Training Plan", path: "/training-plan", Icon: CalendarDays }
    ];

    return(
        <>
            {/* Navigation bar */}
            <header className={styles.navbar}>
                <button
                    type="button"
                    className={styles.logo}
                    onClick={() => handleNavigation("/entry")}
                    aria-label="Go to Daily Entry"
                >
                    <Dumbbell size={30} strokeWidth={1.8} />
                    <span className={styles.logoText}>Fitness Dashboard</span>
                </button>

                {/* Navigation buttons beside the logo */}
                <nav className={styles.navLinks} aria-label="Main navigation">
                    {navItems.map(({ label, path, Icon }) => {
                        const isActive = location.pathname === path;

                        return (
                            <button
                                key={path}
                                type="button"
                                className={`${styles.navButton} ${
                                    isActive ? styles.activeNavButton : ""
                                }`}
                                onClick={() => handleNavigation(path)}
                                aria-current={isActive ? "page" : undefined}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Username dropdown */}
                <div className={styles.userMenuContainer} ref={dropdownRef}>
                    <button
                        type="button"
                        className={styles.userMenuButton}
                        onClick={() =>
                            setDropdownOpen(previous => !previous)
                        }
                        aria-haspopup="true"
                        aria-expanded={dropdownOpen}
                    >
                        <span className={styles.userName}>{username}</span>
                        <ChevronDown
                            size={20}
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
                                onClick={() => handleNavigation("/onboarding")}
                            >
                                <UserRoundPen size={16} />
                                Edit Onboarding Information
                            </button>
                            <button
                                type="button"
                                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                                onClick={handleLogout}
                            >
                                <LogOut size={17} />
                                <span>Log Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

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
                {/* Card sections */}
                <div className = {styles["card-wrapper"]}>
                    {/* Final training score */}
                    <div className =  {styles["card"]}>
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
                    <div className =  {styles["card"]}>
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
                    <div className =  {styles["card"]}>
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
                    <div className =  {styles["card"]}>
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