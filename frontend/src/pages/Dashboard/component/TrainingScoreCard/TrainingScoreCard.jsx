import { Gauge } from "@mui/x-charts/Gauge";
import styles from "./TrainingScoreCard.module.css"

function TrainingScoreCard({score}){
    // For css purpose
    const readinessClass =
        score == null || score === 0 ? "no-score"
        : score < 20 ? "very-low"
        : score < 40 ? "low"
        : score < 60 ? "reduced"
        : score < 80 ? "good"
        : "high";
    // Readiness level
    function getScoreInfo(score) {
        if (score == null || score === 0) {
            return {
            readiness: "No score yet",
            adjustment: "Complete today's check-in",
            target: "—",
            };
        }

        if (score < 20) {
            return {
            readiness: "Very Low Readiness",
            adjustment: "Rest or gentle activity",
            target: "Skip planned workout",
            };
        }

        if (score < 40) {
            return {
            readiness: "Low Readiness",
            adjustment: "Decrease by 25% ↘",
            target: "75%",
            };
        }

        if (score < 60) {
            return {
            readiness: "Reduced Readiness",
            adjustment: "Decrease by 10% ↘",
            target: "90%",
            };
        }

        if (score < 80) {
            return {
            readiness: "Good Readiness",
            adjustment: "Maintain planned workout",
            target: "100%",
            };
        }

        return {
            readiness: "High Readiness",
            adjustment: "Increase by 5% ↗",
            target: "105%",
        };
    }
    const info = getScoreInfo(score);
    return(
        <div className = {styles.wrapper} >
            <div className = {styles["guage"]}>
                <Gauge 
                    width={125} 
                    height={125} 
                    value={score}
                    valueMax={100}
                    text={({ value, valueMax }) => `${value}/${valueMax}`}
                    sx={{
                        "& .MuiGauge-valueText": {
                        fill: "#333",
                        },
                    }}
                />
            </div>
            <div className = {styles["guage-info"]}>
                <div className={`${styles["readiness-tag"]} ${styles[readinessClass]}`}>
                    {info.readiness}
                </div>
                <div> 
                    <span className = {styles["desc"]} >Target:</span> {info.target} </div>
                <div> 
                    <span className = {styles["desc"]}> Workout adjustment:</span> {info.adjustment}
                </div>
            </div>
        </div>
    )
}

export default TrainingScoreCard;
