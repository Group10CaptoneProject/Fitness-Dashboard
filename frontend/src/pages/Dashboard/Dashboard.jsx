import styles from "./Dashboard.module.css";
import { CalendarDays , ClipboardPen , ChartSpline, NotebookText , Gauge  } from "lucide-react";
import MainNavBar from "../../component/MainNavBar/MainNavBar";


function Dashboard(){
    // Formatted current date: Weekday, Month Day, Year
    const today = new Date();

    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const formattedDate = today.toLocaleDateString('en-US', options);

    return(
        <>
            <MainNavBar username = "Username" />
            <div className = {styles["dashboard-wrapper"]}>
                <div className = {styles["dashboard-header"]}>
                    <div className = {styles["welcome-message"]}>
                        <h2>Hello, Username</h2>
                    </div>
                    <div className = {styles["welcome-description"]}> 
                        Here is your training status for today!
                        <div className = {styles["date"]}>
                            <CalendarDays size={24} />
                            {formattedDate}
                        </div>
                    </div>
                </div>
                {/* Card sections */}
                <div className = {styles["card-wrapper"]}>
                    {/* Final training score */}
                    <div className =  {styles["card"]}>
                        <div className = {styles["card-header"]}> 
                            <span className = {styles["tag"]}>
                                <ClipboardPen size={24} color="white" />
                            </span>
                            <div ClassName = {styles["card-title"]}>
                                <h2>Final Training Score</h2>
                            </div>
                        </div>

                    </div>
                    {/* Readiness scale */}
                    <div className =  {styles["card"]}>
                        <div ClassName = {styles["card-title"]}>
                        <div className = {styles["card-header"]}> 
                            <span className = {styles["tag"]}>
                                <Gauge size={24} color="white"/>
                            </span>
                            <div ClassName = {styles["card-title"]}>
                                <h2>Readiness scale</h2>
                            </div>
                        </div>
                        </div>

                    </div>
                    {/* Training trend (7 days) */}
                    <div className =  {styles["card"]}>
                        <div ClassName = {styles["card-title"]}>
                            <div className = {styles["card-header"]}> 
                                <span className = {styles["tag"]}>
                                    <ChartSpline size={24} color="white"/>
                                </span>
                                <div ClassName = {styles["card-title"]}>
                                    <h2>Past 7 Day training trend</h2>
                                </div>
                            </div>
                        </div>
                    </div >
                    {/* Today's summary */}
                    <div className =  {styles["card"]}>
                        <div ClassName = {styles["card-title"]}>
                            <div className = {styles["card-header"]}> 
                                <span className = {styles["tag"]}>
                                    <NotebookText size={24} color="white"/>
                                </span>
                                <div ClassName = {styles["card-title"]}>
                                    <h2>Today's summary</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
export default Dashboard;