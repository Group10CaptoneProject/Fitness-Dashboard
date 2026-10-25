import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./TrainingPlan.module.css";
import {
    CalendarDays,
    Gauge as GaugeIcon,
} from "lucide-react";
function TrainingPlan(){
    const today = new Date();

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = today.toLocaleDateString('en-US', options);

    const username = localStorage.getItem("username")
    return(
        <>
            <MainNav username={username}/>
            <div className = {styles["wrapper"]}>
                <div className = {styles["training-header"]}>
                    <div className = {styles["welcome-message"]}>
                        <h2>Recommended Training Plan</h2>
                    </div>
                    <div className = {styles["welcome-description"]}>
                        Your personalized workout plan based on your goal, recovery, and recent performance
                        <div className = {styles["date"]}>
                            <CalendarDays size={24} />
                            {formattedDate}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}
export default TrainingPlan;