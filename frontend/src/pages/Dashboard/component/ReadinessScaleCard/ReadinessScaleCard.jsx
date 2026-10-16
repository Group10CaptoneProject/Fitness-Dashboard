import styles from "./ReadinessScaleCard.module.css";

function ReadinessScaleCard({ score = 0 }) {
  const levels = [
    { label: "Very low", range: "0–19", className: "veryLow" },
    { label: "Low", range: "20–39", className: "low" },
    { label: "Reduced", range: "40–59", className: "reduced" },
    { label: "Good", range: "60–79", className: "good" },
    { label: "High", range: "80–100", className: "high" },
  ];

  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div className={styles.wrapper}>
      <div className={styles.scaleContainer}>
        <div
          className={styles.scoreMarker}
          style={{ left: `${safeScore}%` }}
        >
          <span className={styles.scoreTag}>{safeScore}</span>
          <span className={styles.markerArrow}>▼</span>
        </div>

        <div className={styles.scale}>
          {levels.map((level) => (
            <div
              key={level.label}
              className={`${styles.segment} ${styles[level.className]}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.labels}>
        {levels.map((level) => (
          <div key={level.label}>
            <span>{level.label}</span>
            <span>{level.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReadinessScaleCard;