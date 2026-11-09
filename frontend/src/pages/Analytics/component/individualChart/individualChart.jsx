import { LineChart } from "@mui/x-charts/LineChart";
import styles from "./individualChart.module.css";

function IndividualChart({scores =[], selectedScores = []}) {
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


    const allSeries = [
        {
            data: trainingScores,
            label: "Training",
            id: "training",
            color: "#2563eb",
            showMark: true,
        },
        {
            data: recoveryScores,
            label: "Recovery",
            id: "recovery",
            color: "#16a34a",
            showMark: true,
        },
        {
            data: fatigueScores,
            label: "Fatigue",
            id: "fatigue",
            color: "#dc2626",
            showMark: true,
        },
        {
            data: workloadScores,
            label: "Workload",
            id: "workload",
            color: "#9333ea",
            showMark: true,
        },
    ];

    if (selectedScores.length === 0) {
        return (
            <div className={styles["no-data"]}>
                Select at least one score to display.
            </div>
        );
    }

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

                series={allSeries.filter((series) => selectedScores.includes(series.id))}
            />
        </div>
    );

}
export default IndividualChart;


