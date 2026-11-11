import { useEffect, useState } from "react";
import { completeWorkout, completedWorkouts } from "../../utils/completedWorkouts";
import IntensityAdjustment from "./IntensityAdjustment";
import { adjustExercise, intensityFactor } from "../../utils/trainingIntensity";
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
    Circle,
} from "lucide-react";

const equipmentOptions = [
    "bodyweight",
    "dumbbells",
    "barbell",
    "kettlebells",
    "resistance_bands",
    "machines",
    "cable"
];

function TrainingPlan(){

    const [goal, setGoal] = useState("");
    const [focus, setFocus] = useState("");
    const [editingEquipment, setEditingEquipment] = useState(false);
    const [equipment, setEquipment] = useState(null);
    const [profileEquipment, setProfileEquipment] = useState([]);
    const [savingEquipment, setSavingEquipment] = useState(false);
    const [equipmentError, setEquipmentError] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [message, setMessage] = useState("");
    const [reload, setReload] = useState(0);
    const [openMenu, setOpenMenu] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [trainingScore, setTrainingScore] = useState(null);
    const [scoreLoading, setScoreLoading] = useState(true);
    const [scoreError, setScoreError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        async function fetchRecommendations() {
            setLoading(true);
            setError("");
            setExercises([]);
            const token = localStorage.getItem("access_token");
            try {
                if (!token) throw new Error("Sign in to see your training plan.");
                const params = new URLSearchParams();
                if (goal) params.set("goal", goal);
                if (focus) params.set("focus", focus);
                // Send an explicit empty value when all equipment is deselected.
                if (equipment !== null) {
                    (equipment.length ? equipment : [""]).forEach(item => params.append("equipment", item));
                }
                const today = new Date();
                const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                params.set("target_date", localDate);
                const apiBase = (process.env.REACT_APP_API_URL || "http://localhost:8888").replace(/\/$/, "");
                const response = await fetch(`${apiBase}/analytics/exercise-recommendation?${params}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(response.status === 401 ? "Your session expired. Sign in again." :
                        (typeof data.detail === "string" ? data.detail : "Unable to load your training plan."));
                }
                if (controller.signal.aborted) return;
                const done = completedWorkouts();
                setExercises(data.recommendations.filter(exercise => !done.some(item => item.id === exercise.id || item.name.toLowerCase() === exercise.name.toLowerCase())).map(exercise => ({
                    ...exercise,
                    rest: `${exercise.rest_seconds} sec`,
                    equipment: exercise.equipment.join(", "),
                })));
                setProfileEquipment(Array.isArray(data.equipment_available) ? data.equipment_available : []);
                setMessage(data.message || "No exercises available for this plan.");
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }
        fetchRecommendations();
        return () => controller.abort();
    }, [goal, focus, equipment, reload]);

    useEffect(() => {
        const controller = new AbortController();
        async function fetchTrainingScore() {
            setScoreLoading(true);
            setScoreError(false);
            setTrainingScore(null);
            try {
                const token = localStorage.getItem("access_token");
                if (!token) throw new Error("Sign in to see your training score.");
                const apiBase = (process.env.REACT_APP_API_URL || "http://localhost:8888").replace(/\/$/, "");
                const response = await fetch(`${apiBase}/dashboard/scores`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error("Unable to load training score.");
                const scores = await response.json();
                const latest = [...scores].sort((a, b) => b.score_date.localeCompare(a.score_date))[0];
                if (!controller.signal.aborted) setTrainingScore(latest?.final_training_score ?? null);
            } catch (error) {
                if (!controller.signal.aborted) setScoreError(true);
            } finally {
                if (!controller.signal.aborted) setScoreLoading(false);
            }
        }
        fetchTrainingScore();
        return () => controller.abort();
    }, [reload]);

    const factor = scoreLoading || scoreError ? null : intensityFactor(trainingScore);
    const adjustedExercises = factor === 0 ? [] : exercises.map(exercise => adjustExercise(exercise, factor));
    const planLoading = loading || scoreLoading;
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
            (current ?? profileEquipment).includes(item)
                ? (current ?? profileEquipment).filter(value => value !== item)
                : [...(current ?? profileEquipment), item]
        );
        setEquipmentError("");
    }

    async function saveEquipment(){
        const selectedEquipment = equipment ?? profileEquipment;

        // UserProfilePatch currently requires at least one equipment value.
        if (selectedEquipment.length === 0) {
            setEquipmentError("Select at least one equipment option before saving.");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            setEquipmentError("Your session has expired. Sign in again.");
            return;
        }

        setSavingEquipment(true);
        setEquipmentError("");
        try {
            const apiBase = (process.env.REACT_APP_API_URL || "http://localhost:8888").replace(/\/$/, "");
            const response = await fetch(`${apiBase}/profile/user-profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ equipment_available: selectedEquipment }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(response.status === 401
                    ? "Your session expired. Sign in again."
                    : (typeof data.detail === "string" ? data.detail : "Unable to save your equipment preferences."));
            }

            // Use the server's response as the saved source of truth.
            setProfileEquipment(Array.isArray(data.equipment_available) ? data.equipment_available : selectedEquipment);
            setEquipment(null);
            setEditingEquipment(false);
            setReload(value => value + 1);
        } catch (error) {
            setEquipmentError(error.message || "Unable to save your equipment preferences.");
        } finally {
            setSavingEquipment(false);
        }
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
                            <Circle size={16} aria-hidden="true" /> YOUR TRAINING, YOUR PACE
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
                            <option value="">Saved profile goal</option>
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
                        <IntensityAdjustment score={trainingScore} loading={scoreLoading} error={scoreError} />
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
                            <option value="">Today’s weekly split</option>
                            <option value="upper_body">Upper Body</option>
                            <option value="lower_body">Lower Body</option>
                            <option value="cardio_core">Cardio Core</option>
                        </select>
                    </section>
                    <button
                        className = {styles["equipment-button"]}
                        type="button"
                        onClick={() => { setEquipment(null); setEquipmentError(""); setEditingEquipment(true); }}
                    >
                        <Settings size={22} aria-hidden="true" />
                        Edit Equipment
                    </button>
                </div>

                {notice && <p role="status">{notice} <a href="/entry">Open Daily Entry</a></p>}
                {error && <p className={styles["error-message"]} role="alert">{error}</p>}
                <button type="button" className={styles["refresh-button"]} disabled={loading}
                    onClick={() => setReload(value => value + 1)}>Refresh recommendations</button>

                {/* Exercise table */}
                <section className = {styles["exercise-section"]} aria-labelledby="muscle-heading">
                    <h2 id="muscle-heading" tabIndex={-1}>
                        <span className = {styles["icon"]}>
                            <NotebookText size={22} aria-hidden="true" />
                        </span>
                        Recommended Exercises
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
                                {(planLoading || (!error && adjustedExercises.length === 0)) && (
                                    <tr><td colSpan={6} className={styles["empty-state"]} role="status">
                                        {planLoading ? "Loading your training plan…" : factor === 0 ? "Skip planned workout. Rest or choose gentle activity today." : message}
                                    </td></tr>
                                )}
                                {!planLoading && adjustedExercises.map((exercise, index) => (
                                    <tr key={exercise.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {exercise.name && (
                                                <div className = {styles["exercise-info"]}>
                                                    {exercise.gif_url ? (
                                                        <img className={styles["exercise-image"]} src={exercise.gif_url}
                                                            alt={`${exercise.name} demonstration`} loading="lazy"
                                                            onError={() => setExercises(current => current.map(item =>
                                                                item.id === exercise.id ? { ...item, gif_url: null } : item))} />
                                                    ) : <span className={styles["image-placeholder"]}>GIF unavailable</span>}
                                                    <span>{exercise.name}<br /><small>{exercise.target_muscle?.join(", ")}</small></span>
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Set x Reps">
                                            <span>{exercise.name ? (exercise.reps_by_set?.length && new Set(exercise.reps_by_set).size > 1
                                                ? `${exercise.sets} sets: ${exercise.reps_by_set.join(" / ")} reps`
                                                : `${exercise.sets} × ${exercise.reps}`) : "—"}</span>
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
                                                            <button type="button" onClick={() => {
                                                                try {
                                                                    completeWorkout(exercise);
                                                                    setExercises(current => current.filter(item => item.id !== exercise.id));
                                                                    setNotice(`${exercise.name} added to Today’s Workout in Daily Entry.`);
                                                                    setOpenMenu(null);
                                                                } catch (error) { setError(error.message); }
                                                            }}>Done</button>
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
                            <p>Choose the equipment you have available. Saving updates your profile and refreshes your recommendations.</p>
                            {equipmentOptions.map(item => (
                                <label className = {styles["equipment-option"]} key={item}>
                                    <input
                                        type="checkbox"
                                        checked={(equipment ?? profileEquipment).includes(item)}
                                        onChange={() => toggleEquipment(item)}
                                    />
                                    {item}
                                </label>
                            ))}
                            {equipmentError && <p className={styles["error-message"]} role="alert">{equipmentError}</p>}
                            <button
                                className = {styles["done-button"]}
                                type="button"
                                disabled={savingEquipment}
                                onClick={saveEquipment}
                            >
                                {savingEquipment ? "Saving…" : "Save Equipment"}
                            </button>
                        </section>
                    </div>
                )}
            </main>
        </>
    )
}
export default TrainingPlan;
