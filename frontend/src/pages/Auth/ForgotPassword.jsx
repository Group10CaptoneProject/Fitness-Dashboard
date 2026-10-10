import { Link, useNavigate} from "react-router";
import styles from "./auth.module.css";
import { useState } from "react";
import { Dumbbell } from "lucide-react";

function ForgotPassword() {

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
  
    setError("");
    setLoading(true);
  
    try {
      const response = await fetch("http://localhost:8888/auth/forgot-password",{
          method: "POST",
          headers: {"Content-Type": "application/json",},
          body: JSON.stringify({ email }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.detail || "Unable to send verification code");
        return;
      }
  
      sessionStorage.setItem("resetEmail", email);
  
      navigate("/verify-reset-code");
  
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-layout"]}>
        {/* Left blue section */}
        <section className={styles["hero-panel"]}>
          <div className={styles["home-logo"]}>
            <Link to ="/">
                <Dumbbell size={45} color="white" strokeWidth={2} />
                <span>Fitness Dashboard</span>
            </Link>
          </div>
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

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value ={email}
                onChange = {(e) => setEmail(e.target.value)}
                required
              />
              <div className={styles["error"]}>{error}</div>

              <button type="submit" disabled = {loading}>Send verification code</button>
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