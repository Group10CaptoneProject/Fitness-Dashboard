import { Link } from "react-router";
import styles from "./NotFound.module.css";

function NotFound(){
    return (
        <div className={styles["not-found-page"]}>
          <div className={styles["not-found-content"]}>
            <div className={styles["not-found-image"]}></div>
            <Link
              to="/"
              className={styles["home-button"]}
            >
              Back to Home
            </Link>
          </div>
        </div>
      );
}

export default NotFound;