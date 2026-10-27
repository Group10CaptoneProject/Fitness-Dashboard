import CalendarHeatmap from 'react-calendar-heatmap';
import styles from "./CalendarHM.module.css"


function CalendarHM({
    startDate = new Date(new Date().getFullYear(), 0, 1), 
    endDate = new Date(new Date().getFullYear(), 11, 31), 
    data = [],
}){

    return(
        <div className={styles.calendarScroll} tabIndex={0} role="region" aria-label="Training activity calendar, scroll horizontally to see the full year">
        <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={data}
        />
        </div>
    )

}
export default CalendarHM
