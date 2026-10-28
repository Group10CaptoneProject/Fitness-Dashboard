import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  Clock3,
  BicepsFlexed,
  BedDouble,
  Zap,
  Brain,
  HeartPulse,
  Plus,
  ArrowRight,
  Trash2,
  ChevronDown,
} from "lucide-react";
import styles from "./DailyEntry.module.css";
import MainNav from "../../component/MainNavBar/MainNav";

// Get today's date in local YYYY-MM-DD format
const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Format the selected date without timezone shifts
const formatDate = (dateString) => {
  if (!dateString) return "Select a date";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Create a blank exercise entry
const createExercise = () => ({
  id: `${Date.now()}-${Math.random()}`,
  duration: "",
  muscleGroup: "",
  muscleArea: "",
  weights: "",
  exercise: "",
  difficulty: "",
});

const goalOptions = [
  { value: "hypertrophy", label: "Hypertrophy (Muscle Growth)" },
  { value: "endurance", label: "Improve Endurance" },
  { value: "healthy_lifestyle", label: "Healthy Lifestyle" },
];

const muscleAreaOptions = {
  upperBody: ["Chest", "Biceps", "Triceps", "Shoulders"],
  lowerBody: ["Quads", "Hamstrings", "Glutes", "Calves"],
  cardio: ["Abs"]
};

const ratingItems = [
  { key: "sleep", label: "Sleep Quality", Icon: BedDouble },
  { key: "energy", label: "Energy Level", Icon: Zap },
  { key: "soreness", label: "Soreness", Icon: BicepsFlexed },
  { key: "stress", label: "Stress", Icon: Brain },
];

const getRatingLabel = (value) => {
  if (value <= 3) return "Easy";
  if (value <= 7) return "Medium";
  return "Hard";
};

const getRatingClass = (value) => {
  if (value <= 3) return styles.easy;
  if (value <= 7) return styles.medium;
  return styles.hard;
};

const clampRating = (value) =>
  Math.min(10, Math.max(0, Number(value)));

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = true,
}) {
  return (
    <div className={styles.selectWrapper}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        className={styles.selectIcon}
        aria-hidden="true"
      />
    </div>
  );
}

function RatingControl({ label, value, onChange, Icon }) {
  // Keep the slider centered while leaving the number field empty initially
  const sliderValue = value === "" ? 5 : Number(value);
  const percentage = `${(sliderValue / 10) * 100}%`;

  return (
    <div className={styles.ratingRow}>
      <div className={styles.roundIcon}>
        <Icon size={22} strokeWidth={2.2} />
      </div>

      <div className={styles.ratingMain}>
        <label className={styles.ratingLabel}>
          {label} <span>(0-10)</span>
        </label>

        <input
          className={styles.rangeInput}
          type="range"
          min="0"
          max="10"
          step="1"
          value={sliderValue}
          onChange={(event) =>
            onChange(clampRating(event.target.value))
          }
          style={{ "--range-progress": percentage }}
          aria-label={label}
        />
      </div>

      <input
        className={styles.ratingValue}
        type="number"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;

          if (nextValue === "") {
            onChange("");
            return;
          }

          if (/^\d+$/.test(nextValue)) {
            onChange(clampRating(nextValue));
          }
        }}
        aria-label={`${label} value`}
        required
      />

      <span
        className={`${styles.ratingBadge} ${getRatingClass(
          sliderValue
        )}`}
      >
        {getRatingLabel(sliderValue)}
      </span>
    </div>
  );
}

function ExerciseCard({
  exercise,
  index,
  total,
  updateExercise,
  onDelete,
}) {
  // Keep the difficulty slider centered until a value is selected
  const sliderValue =
    exercise.difficulty === "" ? 5 : Number(exercise.difficulty);

  const percentage = `${(sliderValue / 10) * 100}%`;

  const updateDifficulty = (value) => {
    if (value === "") {
      updateExercise(exercise.id, "difficulty", "");
      return;
    }

    if (/^\d+$/.test(value)) {
      updateExercise(
        exercise.id,
        "difficulty",
        clampRating(value)
      );
    }
  };

  const content = (
    <>
      <div className={styles.durationRow}>
        <div className={styles.roundIcon}>
          <Clock3 size={22} />
        </div>

        <div className={styles.durationContent}>
          <label htmlFor={`duration-${exercise.id}`}>
            Workout Duration <span>Maximum: 180 min</span>
          </label>

          <div className={styles.inputWithUnit}>
            <input
              id={`duration-${exercise.id}`}
              type="number"
              min="1"
              max="180"
              step="1"
              inputMode="numeric"
              placeholder="Enter Workout Duration"
              value={exercise.duration}
              onChange={(event) =>
                updateExercise(
                  exercise.id,
                  "duration",
                  event.target.value
                )
              }
              onBlur={() => {
                if (exercise.duration === "") return;

                const number = Number(exercise.duration);
                if (!Number.isFinite(number)) return;

                updateExercise(
                  exercise.id,
                  "duration",
                  String(
                    Math.min(180, Math.max(1, Math.trunc(number)))
                  )
                );
              }}
              required
            />
            <span>min</span>
          </div>
        </div>
      </div>

      <div className={styles.exerciseFields}>
        <div className={styles.field}>
          <label>Muscle Group</label>
          <SelectField
            value={exercise.muscleGroup}
            onChange={(event) => {
              updateExercise(
                exercise.id,
                "muscleGroup",
                event.target.value
              );
              updateExercise(exercise.id, "muscleArea", "");
            }}
            placeholder="Select Muscle Group"
            options={Object.keys(muscleAreaOptions).map((group) => ({
              value: group,
              label: group
                .replace("_", " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase()),
            }))}
          />
        </div>

        <div className={styles.field}>
          <label>Muscle Area</label>
          <SelectField
            value={exercise.muscleArea}
            onChange={(event) =>
              updateExercise(
                exercise.id,
                "muscleArea",
                event.target.value
              )
            }
            placeholder="Select Muscle Area"
            disabled={!exercise.muscleGroup}
            options={(
              muscleAreaOptions[exercise.muscleGroup] || []
            ).map((area) => ({
              value: area,
              label: area,
            }))}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`weights-${exercise.id}`}>
            Weights <span>(Optional)</span>
          </label>
          <input
            id={`weights-${exercise.id}`}
            type="text"
            placeholder="Enter Weights"
            value={exercise.weights}
            onChange={(event) =>
              updateExercise(
                exercise.id,
                "weights",
                event.target.value
              )
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`exercise-${exercise.id}`}>
            Exercise <span>(Optional)</span>
          </label>
          <input
            id={`exercise-${exercise.id}`}
            type="text"
            placeholder="e.g. Bench Press"
            value={exercise.exercise}
            onChange={(event) =>
              updateExercise(
                exercise.id,
                "exercise",
                event.target.value
              )
            }
          />
        </div>
      </div>

      <div className={styles.difficultyRow}>
        <div className={styles.roundIcon}>
          <BicepsFlexed size={22} />
        </div>

        <div className={styles.difficultyContent}>
          <label>
            Perceived Difficulty <span>(0-10)</span>
          </label>

          <div className={styles.difficultyControl}>
            <input
              className={styles.rangeInput}
              type="range"
              min="0"
              max="10"
              step="1"
              value={sliderValue}
              onChange={(event) =>
                updateExercise(
                  exercise.id,
                  "difficulty",
                  clampRating(event.target.value)
                )
              }
              style={{ "--range-progress": percentage }}
              aria-label={`Exercise ${index + 1} perceived difficulty`}
            />

            <input
              className={styles.ratingValue}
              type="number"
              min="0"
              max="10"
              step="1"
              value={exercise.difficulty}
              onChange={(event) =>
                updateDifficulty(event.target.value)
              }
              aria-label={`Exercise ${index + 1} difficulty value`}
              required
            />

            <span
              className={`${styles.ratingBadge} ${getRatingClass(
                sliderValue
              )}`}
            >
              {getRatingLabel(sliderValue)}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  // Show exercise cards and delete controls only when multiple exercises exist
  if (total === 1) {
    return <div className={styles.singleExercise}>{content}</div>;
  }

  return (
    <div className={styles.exerciseCard}>
      <div className={styles.exerciseCardHeading}>
        <span>Exercise {index + 1}</span>
        <button
          type="button"
          className={styles.deleteExerciseButton}
          onClick={onDelete}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
      {content}
    </div>
  );
}

function DailyEntry() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);

  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("user_name") ||
    localStorage.getItem("name") ||
    "Username";

  const [entryDate, setEntryDate] = useState(getToday());
  const [goal, setGoal] = useState("");

  const [ratings, setRatings] = useState({
    sleep: "",
    energy: "",
    soreness: "",
    stress: "",
  });

  const [heartRate, setHeartRate] = useState("");
  const [exercises, setExercises] = useState([createExercise()]);
  const [error, setError] = useState("");

  // Open the native date picker when the date button is clicked
  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.focus();
        input.click();
      }
    } catch {
      input.focus();
      input.click();
    }
  }

  function handleDateChange(event) {
    const selectedDate = event.target.value;

    if (selectedDate && selectedDate <= getToday()) {
      setEntryDate(selectedDate);
      setError("");
    }
  }

  function updateRating(key, value) {
    setRatings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setError("");
  }

  // Keep numeric input values as strings while typing
  function updateExercise(id, key, value) {
    setExercises((previous) =>
      previous.map((exercise) =>
        exercise.id === id
          ? { ...exercise, [key]: value }
          : exercise
      )
    );
    setError("");
  }

  function addExercise() {
    setExercises((previous) => [...previous, createExercise()]);
    setError("");
  }

  // Confirm before deleting an exercise
  function deleteExercise(id) {
    if (exercises.length <= 1) return;

    const exercise = exercises.find((item) => item.id === id);
    const exerciseName = exercise?.exercise.trim();

    const message = exerciseName
      ? `Are you sure you want to delete "${exerciseName}"?`
      : "Are you sure you want to delete this exercise?";

    if (window.confirm(message)) {
      setExercises((previous) =>
        previous.filter((item) => item.id !== id)
      );
      setError("");
    }
  }

  function validateEntry() {
    if (!entryDate || entryDate > getToday()) {
      return "Please select today or a date in the past";
    }

    if (!goal) {
      return "Please select a training goal";
    }

    const ratingLabels = {
      sleep: "Sleep Quality",
      energy: "Energy Level",
      soreness: "Soreness",
      stress: "Stress",
    };

    for (const key of Object.keys(ratingLabels)) {
      const value = ratings[key];

      if (
        value === "" ||
        !Number.isInteger(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > 10
      ) {
        return `Please set ${ratingLabels[key]} using its slider or enter a number from 0 to 10`;
      }
    }

    if (
      heartRate === "" ||
      !Number.isInteger(Number(heartRate)) ||
      Number(heartRate) < 1 ||
      Number(heartRate) > 250
    ) {
      return "Please enter a heart rate between 1 and 250 BPM";
    }

    if (exercises.length === 0) {
      return "Please add at least one exercise";
    }

    for (let index = 0; index < exercises.length; index += 1) {
      const exercise = exercises[index];
      const label = `Exercise ${index + 1}`;

      if (
        exercise.duration === "" ||
        !Number.isInteger(Number(exercise.duration)) ||
        Number(exercise.duration) < 1 ||
        Number(exercise.duration) > 180
      ) {
        return `${label}: enter a duration from 1 to 180 minutes`;
      }

      if (!exercise.muscleGroup) {
        return `${label}: please select a muscle group`;
      }

      if (!exercise.muscleArea) {
        return `${label}: please select a muscle area`;
      }

      if (
        exercise.difficulty === "" ||
        !Number.isInteger(Number(exercise.difficulty)) ||
        Number(exercise.difficulty) < 0 ||
        Number(exercise.difficulty) > 10
      ) {
        return `${label}: set perceived difficulty using its slider or enter a number from 0 to 10`;
      }
    }

    return "";
  }

  function handleCalculateScore(event) {
    event.preventDefault();

    const validationError = validateEntry();

    if (validationError) {
      setError(validationError);
      return;
    }

    const entry = {
      entry_date: entryDate,
      goal,
      sleep: Number(ratings.sleep),
      energy_level: Number(ratings.energy),
      soreness: Number(ratings.soreness),
      stress: Number(ratings.stress),
      heart_rate: Number(heartRate),
      exercises: exercises.map((exercise) => ({
        duration: Number(exercise.duration),
        muscle_group: exercise.muscleGroup,
        muscle_area: exercise.muscleArea,
        weights: exercise.weights.trim() || null,
        exercise_name: exercise.exercise.trim() || null,
        difficulty: Number(exercise.difficulty),
      })),
    };

    // Keep the completed entry available for the dashboard
    sessionStorage.setItem("daily_entry_draft", JSON.stringify(entry));
    navigate("/dashboard", { state: { dailyEntry: entry } });
  }

  return (
    <div className={styles.page}>
      <MainNav username={username} />

      <main className={styles.main}>
        <div className={styles.pageHeading}>
          <div>
            <h1>Daily Entry</h1>
            <p>Tell us how you are feeling and what you trained today</p>
          </div>

          {/* Compact date button with a hidden native date picker */}
          <div className={styles.datePickerWrapper}>
            <button
              type="button"
              className={styles.dateDisplay}
              onClick={openDatePicker}
              aria-label={`Choose entry date. Current date: ${formatDate(
                entryDate
              )}`}
            >
              <CalendarDays
                className={styles.dateIcon}
                aria-hidden="true"
              />
              <span className={styles.dateText}>
                {formatDate(entryDate)}
              </span>
            </button>

            <input
              ref={dateInputRef}
              className={styles.nativeDateInput}
              type="date"
              value={entryDate}
              max={getToday()}
              onChange={handleDateChange}
              tabIndex={-1}
              aria-label="Choose entry date"
            />
          </div>
        </div>

        <form
          className={styles.entryGrid}
          onSubmit={handleCalculateScore}
        >
          <div className={styles.leftColumn}>
            <section className={`${styles.card} ${styles.goalCard}`}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>1</span>
                <div>
                  <h2>Training Goal</h2>
                  <p>What is your primary goal for today’s training?</p>
                </div>
              </div>

              <div className={styles.goalField}>
                <SelectField
                  value={goal}
                  onChange={(event) => {
                    setGoal(event.target.value);
                    setError("");
                  }}
                  placeholder="Select Goal"
                  options={goalOptions}
                />
              </div>
            </section>

            <section
              className={`${styles.card} ${styles.recoveryCard}`}
            >
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>2</span>
                <div>
                  <h2>Recovery &amp; Fatigue</h2>
                  <p>How are you feeling today?</p>
                </div>
              </div>

              <div className={styles.ratingLegend}>
                <div className={styles.legendEasy}>
                  <strong>Easy/Good</strong>
                  <span>0 - 3</span>
                </div>
                <div className={styles.legendMedium}>
                  <strong>Medium/Okay</strong>
                  <span>4 - 7</span>
                </div>
                <div className={styles.legendHard}>
                  <strong>Hard/Bad</strong>
                  <span>8 - 10</span>
                </div>
              </div>

              <div className={styles.ratingList}>
                {ratingItems.map(({ key, label, Icon }) => (
                  <RatingControl
                    key={key}
                    label={label}
                    value={ratings[key]}
                    onChange={(value) => updateRating(key, value)}
                    Icon={Icon}
                  />
                ))}
              </div>

              <div className={styles.heartRateRow}>
                <div className={styles.roundIcon}>
                  <HeartPulse size={22} />
                </div>

                <div className={styles.heartRateField}>
                  <label htmlFor="heart-rate">Heart Rate</label>
                  <input
                    id="heart-rate"
                    type="number"
                    min="1"
                    max="250"
                    step="1"
                    inputMode="numeric"
                    placeholder="Enter Heart Rate"
                    value={heartRate}
                    onChange={(event) => {
                      setHeartRate(event.target.value);
                      setError("");
                    }}
                    required
                  />
                </div>

                <span className={styles.unit}>BPM</span>
              </div>
            </section>
          </div>

          <div className={styles.rightColumn}>
            <section
              className={`${styles.card} ${styles.workoutCard}`}
            >
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>3</span>
                <div>
                  <h2>Today’s Workout</h2>
                  <p>Enter details about your workout session</p>
                </div>
              </div>

              <div className={styles.workoutScroll}>
                {exercises.map((exercise, index) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    total={exercises.length}
                    updateExercise={updateExercise}
                    onDelete={() => deleteExercise(exercise.id)}
                  />
                ))}

                <button
                  type="button"
                  className={styles.addExerciseButton}
                  onClick={addExercise}
                >
                  <Plus size={18} />
                  Add Exercise
                </button>
              </div>
            </section>

            <section className={`${styles.card} ${styles.scoreCard}`}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>4</span>
                <div>
                  <h2>Calculate My Score</h2>
                  <p>
                    Complete the required fields to continue to your
                    dashboard
                  </p>
                </div>
              </div>

              {error && (
                <p className={styles.errorMessage} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={styles.calculateButton}
              >
                Calculate My Score
                <ArrowRight size={20} />
              </button>
            </section>
          </div>
        </form>
      </main>
    </div>
  );
}

export default DailyEntry;