import NavBar from "./component/NavigateBar";
import styles from "./Landing.module.css";
import heroVideo from "../../assets/videos/hero-video.mp4";

function Landing() {
  return (
    <div className={styles["landing-page"]}>
      <NavBar />

      {/* Hero */}
      <section className={styles["hero"]}>
        <video
          className={styles["hero-video"]}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className={styles["hero-overlay"]}></div>

        <div className={styles["hero-content"]}>
          <p className={styles["hero-label"]}>
            TRAIN SMARTER. RECOVER BETTER.
          </p>


          <p className={styles["hero-description"]}>
            Track recovery, fatigue, workload, and readiness so you can
            understand when to push harder and when to recover.
          </p>

          <div className={styles["hero-buttons"]}>
            <a
              href="/register"
              className={styles["primary-button"]}
            >
              Get Started
            </a>

            <a
              href="#features"
              className={styles["secondary-button"]}
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;