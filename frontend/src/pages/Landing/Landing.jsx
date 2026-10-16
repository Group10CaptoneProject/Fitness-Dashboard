import NavBar from "./component/NavigateBar/NavigateBar";
import styles from "./Landing.module.css";
import heroVideo from "../../assets/videos/hero-video.mp4";
import ScrollRevealText from "./component/ScrollRevealText/ScrollRevealText";

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
      <section className={`${styles["landing-section"]} ${styles["about-section"]}`} id ="about">
        <div className = {styles["section-wrapper"]}>
          <div className = {styles["section-heading"]}>
            ABOUT US
          </div>
          <div className = {styles["about-body"]}>
            <div>
              <h2>
                <ScrollRevealText />
              </h2>
            </div>

            <div>
              Our Fitness Dashboard team is on a mission to use computation
              and data to make training easier to understand.
              We envision a dashboard that brings workout and recovery information
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
      <section className = {`${styles["landing-section"]} ${styles["features-section"]}`} id ="features">
        <div className = {styles["section-wrapper"]}>
            <div className = {styles["section-heading"]}>
              FEATURES
            </div>
            <div className={styles["features-content"]}>
            <div className={styles["features-grid"]}>
                <div className={styles["feature-table"]}>
                  <h3>Dashboard</h3>

                  <div className={styles["feature-row"]}>
                    Gives users a quick overview of their recovery, fatigue, workload,
                    and overall training status.
                  </div>
                </div>

                <div className={styles["feature-table"]}>
                  <h3>Training Plan</h3>

                  <div className={styles["feature-row"]}>
                    Shows a personalized weekly workout plan that can adjust based on
                    the user's training scores.
                  </div>
                </div>

                <div className={styles["feature-table"]}>
                  <h3>Charts</h3>

                  <div className={styles["feature-row"]}>
                    Displays recovery, fatigue, workload, and overall training trends
                    over time.
                  </div>
                </div>

              </div>
            </div>
                      
            
      
          </div>
      </section>
      <section className = {styles["landing-section"]} id ="snippet">
        <div className = {styles["section-wrapper"]}>
            <div className = {styles["section-heading"]}>
              SNIPPET
            </div>
            <div className={styles["snippet-image-wrapper"]}>
              <div className={styles["snippet-image"]}/>
    
              <div className={styles["snippet-image2"]}/>
            </div>
  
          </div>
      </section>
      <footer className={styles["footer"]}>
        <div className={styles["footer-main"]}>

          <div className={styles["footer-brand"]}>
            <h3>Fitness Dashboard</h3>

            <div className={styles["contact"]}>
              <div className={styles["contact-title"]}>
                Contact Us
              </div>
              <div>
                Email:{" "}
                <a>
                  fitnessdashboard@fakemail.com
                </a>
              </div>
            </div>
          </div>


        </div>


        <div className={styles["footer-bottom"]} id ="contact">
          &copy; 2026 Leo Zheng, Ying Shan Li, Ryan Lui
        </div>

      </footer>
      
      
    </div>
  );
}

export default Landing;