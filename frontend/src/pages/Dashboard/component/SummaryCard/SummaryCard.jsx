import { Gauge, HeartPulse, BatteryLow, Scale } from "lucide-react";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./SummaryCard.module.css"

function SummaryCard({finalScore = 0, recoveryScore = 0, fatigueScore = 0, workloadBalanceScore = 0}){
    const listObject = [
        {label: "Final Score" , score : finalScore , Icon : Gauge},
        {label: "Recovery" , score : recoveryScore , Icon : HeartPulse},
        {label: "Fatigue" , score : fatigueScore, Icon : BatteryLow},
        {label: "Workload Balance" , score : fatigueScore, Icon : Scale}
    ]
    return(
        <div className = {styles.wrapper}>
            {listObject.map(({ label , score , Icon}) => (
                <div key={label} className = {styles["list-item-container"]}>
                    <span className = {styles["tag"]}>
                        <Icon size={24} color="white" />
                    </span>
                    <span>{label}</span>
                    <strong>{score == null ? "—" : score}</strong>
                    <div>
                        <LinearProgress
                            variant="determinate"
                            value={score}
                        />
                    </div>
                </div>
            ))}

        </div>
    )
}
export default SummaryCard;