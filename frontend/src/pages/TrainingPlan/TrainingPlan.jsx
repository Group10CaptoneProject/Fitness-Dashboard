import { useState, useEffect } from "react";
import MainNav from "../../component/MainNavBar/MainNav";
import styles from "./TrainingPlan.module.css";
import trainingGym from "../../assets/training-gym.jpg";
import {
    CalendarDays,
    Target,
    ArrowDownUp,
    BicepsFlexed,
    Settings,
    NotebookText,
    MoreVertical,
    X,
    Dumbbell,
} from "lucide-react";

// Placeholder content for the frontend preview. Replace with API data when ready.
// 
const initialExercises = [
    {
      id: 1,
        name: "Exercise Name",
        sets: 3,
        reps: 8,
        rest: "45 sec",
        equipment: "----"
    },
    { id: 2 },
    { id: 3 },//  { id: 4 },
];



const equipmentOptions = [
    "bodyweight",
    "dumbbells",
    "barbell",
    "kettlebells",
    "resistance_bands",
    "machines"
];

function TrainingPlan(){

    const [goal, setGoal] = useState("Hypertrophy/Strength");
    const [focus, setFocus] = useState("Upper Body");
    const [editingEquipment, setEditingEquipment] = useState(false);
    const [equipment, setEquipment] = useState([]);
    const [openMenu, setOpenMenu] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    //api function to fetch exercise recommendations
    useEffect(() => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        let active = true;
        async function fetchRecommendations() {
            const token = localStorage.getItem("access_token");
            try {
                if (!token) {
                    throw new Error("Please log in to view your training plan.");
                }
                const response = await fetch("http://localhost:8888/analytics/exercise-recommendation", { //port number is right for calling local host. fixed api path 
                    method: "GET",
                    signal: controller.signal,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(
                        response.status === 401
                            ? "Your session has expired. Please log in again."
                            : (typeof body.detail === "string" ? body.detail : `Failed to fetch exercise recommendations (${response.status})`)
                    );
                }

                const data = await response.json();
                
                if (!active) return;
                if (data.recommendations && data.recommendations.length > 0) {
                    // Map backend response fields to your frontend exercise state
                    const formattedExercises = data.recommendations.map((ex, index) => ({
                        id: index + 1,
                        name: ex.name,
                        sets: 3, // Default sets or map if your backend provides it
                        reps: 8, // Default reps or map if your backend provides it
                        rest: "45 sec",
                        equipment: Array.isArray(ex.equipment) ? ex.equipment.join(", ") : (ex.equipment || "—"),
                        gif_url: ex.gif_url
                    }));
                    setExercises(formattedExercises);
                } else {
                    setExercises([]);
                }
            } catch (error) {
                if (!active) return;
                console.error("Training plan error:", error);
                setError(error.name === "AbortError"
                    ? "The training service took too long to respond. Restart the backend and refresh this page."
                    : error instanceof TypeError
                    ? "Cannot reach the training service. Check that the backend is running on port 8888."
                    : error.message);
            } finally {
                clearTimeout(timeout);
                if (active) setLoading(false);
            }
        }

        fetchRecommendations();
        return () => {
            active = false;
            clearTimeout(timeout);
            controller.abort();
        };
    }, []);

    const username = localStorage.getItem("username") || "Username";
    // Formatted current date: Weekday, Month Day, Year
    const today = new Date();

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = today.toLocaleDateString('en-US', options);

    function toggleEquipment(item){
        setEquipment(current =>
            current.includes(item)
                ? current.filter(value => value !== item)
                : [...current, item]
        );
    }

    return(
        <>
            <MainNav username={username}/>
            <main className = {styles["wrapper"]}>
                <header className = {styles["header"]}>
                    <h1>Recommended Training Plan</h1>
                    <div className = {styles["description"]}>
                        <p>Your personalized workout plan based on your goal, recovery, and recent performance</p>
                        <div className = {styles["date"]}>
                            <CalendarDays size={24} aria-hidden="true" />
                            <time dateTime={new Date().toLocaleDateString("en-CA")}>
                                {formattedDate}
                            </time>
                        </div>
                    </div>
                </header>

                <section className={styles["training-banner"]} aria-labelledby="training-banner-title">
                    <img className={styles["banner-image"]} src={trainingGym} alt="Blue-lit gym with strength and cardio equipment" />
                    <div className={styles["banner-content"]}>
                        <span className={styles["banner-label"]}>
                            <Dumbbell size={16} aria-hidden="true" /> YOUR TRAINING, YOUR PACE
                        </span>
                        <h2 id="training-banner-title">Show up today.<br />Get stronger tomorrow.</h2>
                        <p>A plan built around you. Make every rep count.</p>
                    </div>
                </section>

                {/* Training preferences */}
                <div className = {styles["controls-grid"]}>
                    <section className = {styles["card"]}>
                        <h2>
                            <span className = {styles["icon"]}>
                                <Target size={22} aria-hidden="true" />
                            </span>
                            Training Goal
                        </h2>
                        <select
                            aria-label="Training goal"
                            value={goal}
                            onChange={event => setGoal(event.target.value)}
                        >
                            <option value="hypertrophy">Hypertrophy/Strength</option>
                            <option value="endurance">Muscle Endurance</option>
                            <option value="healthy_lifestyle">General Fitness</option>
                        </select>
                    </section>
                    <section className = {styles["card"]}>
                        <h2>
                            <span className = {styles["icon"]}>
                                <ArrowDownUp size={22} aria-hidden="true" />
                            </span>
                            Intensity Adjustment
                        </h2>
                        <p className = {styles["card-value"]}></p>
                    </section>
                    <section className = {styles["card"]}>
                        <h2>
                            <span className = {styles["icon"]}>
                                <BicepsFlexed size={22} aria-hidden="true" />
                            </span>
                            Focus Area
                        </h2>
                        <select
                            aria-label="Focus area"
                            value={focus}
                            onChange={event => setFocus(event.target.value)}
                        >
                            <option value="upper_body">Upper Body</option>
                            <option value="lower_body">Lower Body</option>
                            <option value="cardio_core">Cardio Core</option>
                        </select>
                    </section>
                    <button
                        className = {styles["equipment-button"]}
                        type="button"
                        onClick={() => setEditingEquipment(true)}
                    >
                        <Settings size={22} aria-hidden="true" />
                        Edit Equipment
                    </button>
                </div>

                {loading && <p role="status">Loading your exercises…</p>}
                {error && <p role="alert">{error}</p>}
                {!loading && !error && exercises.length === 0 && (
                    <p role="status">No exercises match your saved equipment, workout split, and recovery rules today.</p>
                )}

                {/* Exercise table */}
                <section className = {styles["exercise-section"]} aria-labelledby="muscle-heading">
                    <h2 id="muscle-heading" tabIndex={-1}>
                        <span className = {styles["icon"]}>
                            <NotebookText size={22} aria-hidden="true" />
                        </span>
                        Muscle Group
                    </h2>
                    <div className = {styles["table-scroll"]}>
                        <table className = {styles["table"]}>
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Exercise</th>
                                    <th scope="col">Set x Reps</th>
                                    <th scope="col">Rest Time</th>
                                    <th scope="col">Equipment</th>
                                    <th scope="col">
                                        <span className = {styles["sr-only"]}>Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {exercises.map((exercise, index) => (
                                    <tr key={exercise.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {exercise.name && (
                                                <div className = {styles["exercise-info"]}>
                                                    <img
                                                        src={exercise.gif_url}
                                                        alt={exercise.name}
                                                        className={styles["exercise-image"]}
                                                        loading="lazy"
                                                    />
                                                    <span>{exercise.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Set x Reps">
                                            <span>{exercise.name ? `${exercise.sets} × ${exercise.reps}` : "—"}</span>
                                        </td>
                                        <td data-label="Rest Time"><span>{exercise.rest || "—"}</span></td>
                                        <td data-label="Equipment"><span>{exercise.equipment || "—"}</span></td>
                                        <td className = {styles["action-cell"]}>
                                            {exercise.name && (
                                                <>
                                                    <button
                                                        className = {styles["menu-button"]}
                                                        type="button"
                                                        aria-label={`Actions for ${exercise.name}`}
                                                        aria-expanded={openMenu === exercise.id}
                                                        onClick={() => setOpenMenu(openMenu === exercise.id ? null : exercise.id)}
                                                    >
                                                        <MoreVertical size={22} />
                                                    </button>
                                                    {openMenu === exercise.id && (
                                                        <div className = {styles["action-menu"]}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setExercises(current => current.filter(item => item.id !== exercise.id));
                                                                    setOpenMenu(null);
                                                                }}
                                                            >
                                                                Remove exercise
                                                            </button>
                                                            <button type="button" onClick={() => setOpenMenu(null)}>
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Equipment editor */}
                {editingEquipment && (
                    <div className = {styles["backdrop"]} onClick={() => setEditingEquipment(false)}>
                        <section
                            className = {styles["equipment-dialog"]}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="equipment-title"
                            onClick={event => event.stopPropagation()}
                            onKeyDown={event => {
                                if (event.key === "Escape") setEditingEquipment(false);
                            }}
                        >
                            <div className = {styles["dialog-header"]}>
                                <h2 id="equipment-title">Available Equipment</h2>
                                <button
                                    autoFocus
                                    type="button"
                                    className = {styles["menu-button"]}
                                    aria-label="Close equipment editor"
                                    onClick={() => setEditingEquipment(false)}
                                >
                                    <X />
                                </button>
                            </div>
                            <p>Choose your equipment for this preview.</p>
                            {equipmentOptions.map(item => (
                                <label className = {styles["equipment-option"]} key={item}>
                                    <input
                                        type="checkbox"
                                        checked={equipment.includes(item)}
                                        onChange={() => toggleEquipment(item)}
                                    />
                                    {item}
                                </label>
                            ))}
                            <button
                                className = {styles["done-button"]}
                                type="button"
                                onClick={() => setEditingEquipment(false)}
                            >
                                Done
                            </button>
                        </section>
                    </div>
                )}
            </main>
        </>
    )
}
export default TrainingPlan;
