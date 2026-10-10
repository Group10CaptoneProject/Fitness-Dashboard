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
      {/* About */}
      <section className = {styles["about-section"]}>
        <div className = {styles["section-wrapper"]}>
          <div class = {styles["section-heading"]}>
            ABOUT US
          </div>
          <div className = "about-body">
            <div>
              <h2>
                Many adults today train without proper guidance, 
                and some may not know how to interpret the signals their bodies are giving them.
                Our Fitness Dashboard team is on a mission to use computation
                and data to make training easier to understand.
              </h2>
            </div>

            <div>
              Our project is a fitness dashboard that brings workout and recovery information
              together in one place.
              Users create an account, enter basic information about themselves,
              and select their fitness goals, experience level,
              available equipment, and preferred workout days. 
              They can then complete daily check-ins by entering information such as sleep, energy, soreness,
              stress, heart rate, workout duration, and workout difficulty.
              The system uses this data to calculate recovery, fatigue, workload,
              and overall training scores, which are displayed on the dashboard
              to help users better understand their training and recovery.
            </div>
          </div>
          <div>
        </div>
        </div>
      </section>
      
    </div>
  );
}

export default Landing;