import { Link } from "react-router";
import styles from "./ForgotPassword.module.css";

function ForgotPassword() {
  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-layout"]}>
        {/* Left blue section */}
        <section className={styles["hero-panel"]}>
          <div className={styles["hero-content"]}>
            <p>STEP 1 OF 3</p>
            <h1>RECOVER YOUR ACCOUNT.</h1>
            <div>
              <p>Enter the email address associated with your account</p>
              <p>If the email is valid, we'll send a 6-digit verification code to your inbox.</p>
            </div>
            {/* Progress */}
            <div className={styles["progress"]}>
              <div className={styles["progress-active"]}></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </section>

        {/* Right login section */}
        <section className={styles["form-panel"]}>
          <div className={styles["card"]}>
            <h2>Forgot Password?</h2>

            <p className={styles["subtitle"]}>
              Enter your email address to recieve verification code
            </p>

            <form onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
              />

              <button type="submit">Send verification code</button>
            </form>

            <div className={styles["form-links"]}>
              <Link to="/login">Back to login</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ForgotPassword;