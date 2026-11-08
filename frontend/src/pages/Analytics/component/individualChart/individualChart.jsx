import { LineChart } from "@mui/x-charts/LineChart";
import styles from "./individualChart.module.css";

function IndividualChart({scores =[]}) {
        if (scores.length === 0) {
        return (
            <div className={styles["no-data"]}>
                No training data available yet.
            </div>
        );
    }

    const dates = scores.map((score) => {
        // Build the date from its parts so the timezone does not shift it a day back
        const [year, month, day] = String(score.score_date)
            .slice(0, 10)
            .split("-")
            .map(Number);
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    });

    const trainingScores = scores.map(
        (score) => Number(score.final_training_score)
    );

    const recoveryScores = scores.map(
        (score) => Number(score.recovery)
    );

    const fatigueScores = scores.map(
        (score) => Number(score.fatigue)
    )

    const workloadScores = scores.map(
        (score) => Number(score.workload_balance_score)
    );


    return (
        <div className={styles["trend-wrapper"]}>
            <LineChart
                height={350}

                xAxis={[
                    {
                        scaleType: "point",
                        data: dates,
                        label: "Date",
                    },
                ]}

                yAxis={[
                    {
                        min: 0,
                        max: 100,
                        label: "Score",
                    },
                ]}

                series={[
                    {
                        data: trainingScores,
                        label: "Training",
                        showMark: true,
                    },
                    {
                        data: recoveryScores,
                        label: "Recovery",
                        showMark: true,
                    },
                    {
                        data: fatigueScores,
                        label: "Fatigue",
                        showMark: true,
                    },
                    {
                        data: workloadScores,
                        label: "Workload",
                        showMark: true,
                    },
                ]}
            />
        </div>
    );

}
export default IndividualChart;


