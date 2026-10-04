import { Link } from "react-router";
import styles from "./auth.module.css";

function VerifyResetCode() {
    return (
      <div className={styles["login-page"]}>
        <div className={styles["login-layout"]}>
          {/* Left blue section */}
          <section className={styles["hero-panel"]}>
            <div className={styles["hero-content"]}>
              <p>STEP 2 OF 3</p>
              <h1>VERIFY YOUR CODE.</h1>
              <div>
                <p>Enter the 6-digit verification code we sent to your email.</p>
                <p>The code will expire in 10 minutes</p>
              </div>
              {/* Progress */}
              <div className={styles["progress"]}>
                <div></div>
                <div className={styles["progress-active"]}></div>
                <div></div>
              </div>
            </div>
          </section>
  
          {/* Right section */}
          <section className={styles["form-panel"]}>
            <div className={styles["card"]}>
              <h2>Check Mailbox</h2>
    
              <p className={styles["subtitle"]}>
                We've sent a six-digit verification code to your inbox
              </p>
  
              <form onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                />
                <button type="submit">Verify Code</button>
              </form>
  
              <div className={styles["form-links"]}>
                <Link to="/forgot-password">Use a different email</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
  
  export default VerifyResetCode;
  