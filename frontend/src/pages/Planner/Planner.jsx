import MainNav from "../../component/MainNavBar/MainNav";
import WorkoutBanner from "../../component/WorkoutBanner/WorkoutBanner";
import styles from "./Planner.module.css";
import plannerBanner from "../../assets/planner.jpg";
import {useEffect, useState} from "react";
import {Search} from "lucide-react";

const apiBase = (process.env.REACT_APP_API_URL || "http://localhost:8888").replace(/\/+$/, "");

function Planner() {
  const username = localStorage.getItem("username") || "Username";
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [workoutError, setWorkoutError] = useState("");
  const [updatingWorkouts, setUpdatingWorkouts] = useState(false);
  const day = selectedDay.toLowerCase();
  const dayWorkouts = workouts.filter((workout) => workout.day === day);
  const savedIds = new Set(dayWorkouts.map((workout) => workout.exercise_id));

  useEffect(() => {
    const controller = new AbortController();

    async function loadWorkouts() {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBase}/planner/workouts`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load workouts");
        const savedWorkouts = await response.json();
        if (!controller.signal.aborted) setWorkouts(savedWorkouts);
      } catch {
        if (!controller.signal.aborted) {
          setWorkoutError("Could not load saved workouts. Refresh the page to retry.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingWorkouts(false);
      }
    }

    loadWorkouts();
    return () => controller.abort();
  }, []);

  async function saveWorkout(exerciseId) {
    setUpdatingWorkouts(true);
    setWorkoutError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiBase}/planner/workouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ day, exercise_id: exerciseId }),
      });
      if (!response.ok) throw new Error("Could not save workout");
      const saved = await response.json();
      setWorkouts((previous) => [
        ...previous.filter((workout) => (
          workout.day !== saved.day || workout.exercise_id !== saved.exercise_id
        )),
        saved,
      ]);
    } catch {
      setWorkoutError(`Could not save this exercise to ${selectedDay}. Try again.`);
    } finally {
      setUpdatingWorkouts(false);
    }
  }

  async function removeWorkout(exerciseId) {
    setUpdatingWorkouts(true);
    setWorkoutError("");
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams({ day, exercise_id: exerciseId });
      const response = await fetch(`${apiBase}/planner/workouts?${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not remove workout");
      setWorkouts((previous) => previous.filter((workout) => (
        workout.day !== day || workout.exercise_id !== exerciseId
      )));
    } catch {
      setWorkoutError(`Could not remove this exercise from ${selectedDay}. Try again.`);
    } finally {
      setUpdatingWorkouts(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q").trim();
    setResults(null);
    setSearchError("");
    if (!q) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      setSearchError("Sign in to search for exercises.");
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({ q });
      const response = await fetch(`${apiBase}/planner/search-exercises?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Exercise search failed");
      setResults(await response.json());
    } catch {
      setSearchError("Could not search for exercises. Try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <MainNav username={username} />
       <main className = {styles["wrapper"]}>
          <header className = {styles["header"]}>
            <h1>Workout Planner</h1>
            <div className = {styles["description"]}>
                <p>Build your custom workout plans. Search and add exercises to your routines.</p>
            </div>
          </header>
          <WorkoutBanner
            image={plannerBanner}
            imagePositionY="27%"
            label="WEEKLY PLANNER"
            title="Plan your training week"
          >
            Choose a day below to add exercises to your schedule.
          </WorkoutBanner>
          <section>
            <div className = {styles["button-wrapper"]}>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Monday")}>
                Monday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Tuesday")}>
                Tuesday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Wednesday")}>
                Wednesday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Thursday")}>
                Thursday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Friday")}>
                Friday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Saturday")}>
                Saturday
              </button>
              <button className = {styles["button"]} onClick={() => setSelectedDay("Sunday")}>
                Sunday
              </button>
            </div>
          </section>
          <section className = {styles["search-section"]}>
            <h2>{selectedDay}'s Workouts</h2>
            <div aria-live="polite">
              {loadingWorkouts && <p>Loading saved exercises…</p>}
              {workoutError && <p>{workoutError}</p>}
              {!loadingWorkouts && !workoutError && dayWorkouts.length === 0 && (
                <p>No exercises saved for {selectedDay}.</p>
              )}
              {dayWorkouts.length > 0 && (
                <ul>
                  {dayWorkouts.map((workout) => (
                    <li key={workout.exercise_id} className={styles["search-result"]}>
                      <span>{workout.exercise_name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${workout.exercise_name} from ${selectedDay}`}
                        disabled={updatingWorkouts}
                        onClick={() => removeWorkout(workout.exercise_id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form className={styles["search-form"]} onSubmit={handleSearch}>
              <div className={styles["search-bar"]}>
                <Search className={styles["search-icon"]} size={18} aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  aria-label="Search exercises"
                  placeholder="Search exercises..."
                />
              </div>
              <button type="submit" disabled={searching}>Search</button>
            </form>
            <div aria-live="polite">
              {searching && <p>Searching…</p>}
              {searchError && <p>{searchError}</p>}
              {results?.length === 0 && <p>No matching exercises.</p>}
              {results?.length > 0 && (
                <ul>
                  {results.map((exercise) => (
                    <li key={exercise.exercise_id} className={styles["search-result"]}>
                      <span>{exercise.exercise_name}</span>
                      <button
                        type="button"
                        disabled={loadingWorkouts || updatingWorkouts || savedIds.has(exercise.exercise_id)}
                        onClick={() => saveWorkout(exercise.exercise_id)}
                      >
                        {savedIds.has(exercise.exercise_id) ? "Added" : `Add to ${selectedDay}`}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
    </>
  );
}

export default Planner;
