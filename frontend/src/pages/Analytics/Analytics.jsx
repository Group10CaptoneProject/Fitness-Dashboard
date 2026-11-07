import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./Analytics.module.css";
import { CalendarDays, Dumbbell } from "lucide-react";
import analyticImg from "../../assets/analytics.webp";


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
                            <Dumbbell size={16} aria-hidden="true" /> DATA-DRIVEN TRAINING
                        </span>
                        <h2>With Knowledge , <br />Get result more effectively</h2>
                        <p>Train smarter, not harder.</p>
                    </div>
                </section>
            </main>
        </>
    );
}

export default Analytics;