import { useId } from "react";
import { Circle } from "lucide-react";
import styles from "./WorkoutBanner.module.css";

export default function WorkoutBanner({ image, label, title, children, imagePositionY, imageFilter }) {
  const titleId = useId();

  return (
    <section
      className={styles.banner}
      aria-labelledby={titleId}
      style={{ "--workout-banner-position-y": imagePositionY }}
    >
      <img className={styles["banner-image"]} src={image} alt="" style={{ filter: imageFilter }} />
      <div className={styles["banner-content"]}>
        <span className={styles["banner-label"]}>
          <Circle size={16} aria-hidden="true" /> {label}
        </span>
        <h2 id={titleId}>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  );
}
