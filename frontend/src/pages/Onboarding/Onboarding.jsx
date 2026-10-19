
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Dumbbell,
  CalendarDays,
  UsersRound,
  Ruler,
  Weight,
  ArrowRight,
  ArrowLeft,
  Target,
  Clock,
  ChevronDown,
} from "lucide-react";
import styles from "./Onboarding.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8888"
).replace(/\/$/, "");

const REQUEST_TIMEOUT_MS = 20000;

function Onboarding() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Username";

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    experience: "",
    session_duration: "",
    equipment: [],
    workout_days: [],
  });

  // Restore previously saved onboarding answers when the page opens.
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("onboarding_data");

      if (!savedData) {
        return;
      }

      const parsedData = JSON.parse(savedData);

      setFormData((previous) => ({
        ...previous,
        age:
          parsedData.age == null ? "" : String(parsedData.age),
        gender: parsedData.gender || "",
        height:
          parsedData.height == null ? "" : String(parsedData.height),
        weight:
          parsedData.weight == null ? "" : String(parsedData.weight),
        goal: parsedData.goal || "",
        experience: parsedData.experience || "",
        session_duration:
          parsedData.session_duration == null
            ? ""
            : String(parsedData.session_duration),
        equipment: Array.isArray(parsedData.equipment)
          ? parsedData.equipment
          : [],
        workout_days: Array.isArray(parsedData.workout_days)
          ? parsedData.workout_days
          : [],
      }));
    } catch (err) {
      console.error("Failed to load saved onboarding data:", err);
    }
  }, []);

  // Update text inputs and dropdowns.
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  // Update equipment and workout-day checkboxes.
  function handleCheckboxChange(event) {
    const { name, value, checked } = event.target;

    setFormData((previous) => {
      const currentValues = previous[name];

      return {
        ...previous,
        [name]: checked
          ? currentValues.includes(value)
            ? currentValues
            : [...currentValues, value]
          : currentValues.filter((item) => item !== value),
      };
    });

    setError("");
  }

  // Reusable dropdown with a custom arrow.
  function Dropdown({
    name,
    value,
    onChange,
    children,
    required = false,
  }) {
    return (
      <div className={styles.selectWrapper}>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        >
          {children}
        </select>

        <ChevronDown
          className={styles.selectIcon}
          size={18}
          aria-hidden="true"
        />
      </div>
    );
  }

  // Reusable checkbox group.
  function CheckboxGroup({ name, options }) {
    return (
      <div className={styles.checkboxGroup}>
        {options.map((option) => (
          <label key={option.value} className={styles.checkboxOption}>
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={formData[name].includes(option.value)}
              onChange={handleCheckboxChange}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Send a request that cannot wait indefinitely.
  async function fetchWithTimeout(url, options) {
    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(
          "The server took too long to respond. Please check that your backend is running, then try again."
        );
      }

      if (err instanceof TypeError) {
        throw new Error(
          "Cannot connect to the backend. Check that the FastAPI server is running at " +
            API_URL +
            " and that the API URL is correct."
        );
      }

      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Parse the response and turn backend errors into readable messages.
  async function readResponse(response, fallbackMessage) {
    const responseText = await response.text();

    let result = {};

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        result = {};
      }
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your session may have expired. Please log in again and retry."
        );
      }

      const detail = result.detail;

      const message = Array.isArray(detail)
        ? detail
            .map((item) => item.msg || "Invalid input")
            .join(" ")
        : typeof detail === "string"
          ? detail
          : `${fallbackMessage} (HTTP ${response.status}).`;

      throw new Error(message);
    }

    return result;
  }

  // Save onboarding information to the backend.

  async function saveOnboarding() {
    const token = localStorage.getItem("access_token");
  
    if (!token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }
  
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  
    const fitnessProfile = {
      age: Number(formData.age),
      gender: formData.gender,
      height: Number(formData.height),
      weight: Number(formData.weight),
    };
  
    const userProfile = {
      primary_goal: formData.goal,
      experience_level: formData.experience,
      equipment_available: formData.equipment,
      preferred_workout_days: formData.workout_days.map((day) =>
        day.toLowerCase()
      ),
      session_duration: Number(formData.session_duration),
    };
  
    // Start both requests together instead of waiting for each in turn.
    const [fitnessResponse, preferencesResponse] = await Promise.all([
      fetchWithTimeout(`${API_URL}/profile/fitness-profile`, {
        method: "POST",
        headers,
        body: JSON.stringify(fitnessProfile),
      }),
      fetchWithTimeout(`${API_URL}/profile/user-profile`, {
        method: "POST",
        headers,
        body: JSON.stringify(userProfile),
      }),
    ]);
  
    // Check both responses.
    await readResponse(
      fitnessResponse,
      "Could not save your fitness information."
    );
  
    await readResponse(
      preferencesResponse,
      "Could not save your workout preferences."
    );
  }
  

  // Validate each step and save after the user finishes step 2.
  async function handleContinue(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (step === 1) {
      if (
        !formData.age ||
        !formData.gender ||
        !formData.height ||
        !formData.weight
      ) {
        setError("Please complete all fields before continuing.");
        return;
      }

      if (
        !Number.isFinite(Number(formData.age)) ||
        !Number.isFinite(Number(formData.height)) ||
        !Number.isFinite(Number(formData.weight)) ||
        Number(formData.age) < 12 ||
        Number(formData.age) > 120 ||
        Number(formData.height) < 50 ||
        Number(formData.height) > 250 ||
        Number(formData.weight) < 20 ||
        Number(formData.weight) > 300
      ) {
        setError(
          "Please enter a valid age, height (50–250 cm), and weight (20–300 lb)."
        );
        return;
      }

      setStep(2);
      return;
    }

    if (
      !formData.goal ||
      !formData.experience ||
      !formData.session_duration ||
      formData.equipment.length === 0 ||
      formData.workout_days.length === 0
    ) {
      setError(
        "Please select your goal, experience, duration, equipment, and workout days."
      );
      return;
    }


    setLoading(true);

    try {
      await saveOnboarding();
    
      // Store answers locally only after both backend saves succeed.
      localStorage.setItem("onboarding_data", JSON.stringify(formData));
      localStorage.setItem("onboarding_completed", "true");
    
      navigate("/entry");
    } catch (err) {
      console.error("Onboarding save error:", err);
    
      setError(
        err.message || "Unable to save your onboarding information."
      );
    } finally {
      setLoading(false);
    }
    
  }

  const equipmentOptions = [
    { label: "Bodyweight", value: "bodyweight" },
    { label: "Dumbbells", value: "dumbbells" },
    { label: "Kettlebells", value: "kettlebells" },
    { label: "Resistance Bands", value: "resistance_bands" },
    { label: "Barbell", value: "barbell" },
  ];

  const workoutDayOptions = [
    { label: "Mon", value: "Monday" },
    { label: "Tue", value: "Tuesday" },
    { label: "Wed", value: "Wednesday" },
    { label: "Thu", value: "Thursday" },
    { label: "Fri", value: "Friday" },
    { label: "Sat", value: "Saturday" },
    { label: "Sun", value: "Sunday" },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <Dumbbell size={38} strokeWidth={1.8} />
          <span className={styles.logoText}>Fitness Dashboard</span>
        </div>

        <button
          type="button"
          className={styles.userMenu}
          aria-label="User account"
        >
          {username}
          <ChevronDown size={21} />
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.heading}>
          <h1>Let’s get to know you</h1>
          <p>
            This information helps us personalize your fitness experience and
            create the best training plan for you
          </p>
        </div>

        <section className={styles.card}>
          <div className={styles.progressSection}>
            <span className={styles.stepLabel}>Step {step} of 2</span>

            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Onboarding progress"
              aria-valuemin={1}
              aria-valuemax={2}
              aria-valuenow={step}
            >
              <div
                className={styles.progressFill}
                style={{ width: `${step * 50}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleContinue}>
            {step === 1 ? (
              <div className={styles.fieldsGrid}>
                {/* Age */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <CalendarDays size={23} />
                    </span>

                    <div>
                      <h2>Age</h2>
                      <p>
                        Used for basic health analytics and future
                        personalization
                      </p>
                    </div>
                  </div>

                  <div className={styles.inputRow}>
                    <input
                      type="number"
                      name="age"
                      placeholder="Enter Age"
                      aria-label="Age"
                      value={formData.age}
                      onChange={handleChange}
                      min="12"
                      max="120"
                      step="1"
                      required
                    />
                    <span className={styles.unit}>years old</span>
                  </div>
                </div>

                {/* Gender */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <UsersRound size={24} />
                    </span>

                    <div>
                      <h2>Gender</h2>
                      <p>
                        Used as optional profile information and for
                        health-related analytics
                      </p>
                    </div>
                  </div>

                  <Dropdown
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select Gender
                    </option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not_to_say">
                      Prefer not to say
                    </option>
                  </Dropdown>
                </div>

                {/* Height */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Ruler size={23} />
                    </span>

                    <div>
                      <h2>Height</h2>
                      <p>
                        Used with weight to calculate metrics such as BMI
                      </p>
                    </div>
                  </div>

                  <div className={styles.inputRow}>
                    <input
                      type="number"
                      name="height"
                      placeholder="Enter Height"
                      aria-label="Height in centimeters"
                      value={formData.height}
                      onChange={handleChange}
                      min="50"
                      max="250"
                      step="0.1"
                      required
                    />
                    <span className={styles.unit}>cm</span>
                  </div>
                </div>

                {/* Weight */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Weight size={23} />
                    </span>

                    <div>
                      <h2>Weight</h2>
                      <p>
                        Used with height for body-weight-related analytics
                        and progress tracking
                      </p>
                    </div>
                  </div>

                  <div className={styles.inputRow}>
                    <input
                      type="number"
                      name="weight"
                      placeholder="Enter Weight"
                      aria-label="Weight in pounds"
                      value={formData.weight}
                      onChange={handleChange}
                      min="20"
                      max="300"
                      step="0.1"
                      required
                    />
                    <span className={styles.unit}>lb</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.fieldsGrid}>
                {/* Primary goal */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Target size={23} />
                    </span>

                    <div>
                      <h2>Primary Goal</h2>
                      <p>What would you most like to achieve?</p>
                    </div>
                  </div>

                  <Dropdown
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select Your Goal
                    </option>
                    <option value="hypertrophy">
                      Hypertrophy (Muscle Growth)
                    </option>
                    <option value="endurance">Endurance</option>
                    <option value="healthy_lifestyle">
                      Healthy Lifestyle
                    </option>
                  </Dropdown>
                </div>

                {/* Experience level */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Dumbbell size={23} />
                    </span>

                    <div>
                      <h2>Experience Level</h2>
                      <p>Help us personalize your training plan</p>
                    </div>
                  </div>

                  <Dropdown
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select Experience
                    </option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Dropdown>
                </div>

                {/* Workout duration */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Clock size={23} />
                    </span>

                    <div>
                      <h2>Preferred Workout Duration</h2>
                      <p>How long is your typical workout?</p>
                    </div>
                  </div>

                  <Dropdown
                    name="session_duration"
                    value={formData.session_duration}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select Workout Duration
                    </option>

                    {Array.from({ length: 18 }, (_, index) => {
                      const minutes = (index + 1) * 10;

                      return (
                        <option key={minutes} value={String(minutes)}>
                          {minutes} min
                        </option>
                      );
                    })}
                  </Dropdown>
                </div>

                {/* Equipment selection */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Dumbbell size={23} />
                    </span>

                    <div>
                      <h2>Equipment Available</h2>
                      <p>Select the equipment you can use</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.equipmentButton}
                    onClick={() => setEquipmentOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={equipmentOpen}
                  >
                    <span>
                      {formData.equipment.length > 0
                        ? `${formData.equipment.length} selected`
                        : "Choose Equipment"}
                    </span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>

                  {equipmentOpen && (
                    <div
                      className={styles.modalOverlay}
                      onClick={(event) => {
                        if (event.target === event.currentTarget) {
                          setEquipmentOpen(false);
                        }
                      }}
                    >
                      <section
                        className={styles.equipmentModal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="equipment-modal-title"
                      >
                        <div className={styles.modalHeader}>
                          <div>
                            <h2 id="equipment-modal-title">
                              Available Equipment
                            </h2>
                            <p>Select all that apply.</p>
                          </div>

                          <button
                            type="button"
                            className={styles.modalClose}
                            onClick={() => setEquipmentOpen(false)}
                            aria-label="Close equipment selection"
                          >
                            ×
                          </button>
                        </div>

                        <div className={styles.modalOptions}>
                          {equipmentOptions.map((equipment) => (
                            <label
                              key={equipment.value}
                              className={styles.modalOption}
                            >
                              <input
                                type="checkbox"
                                name="equipment"
                                value={equipment.value}
                                checked={formData.equipment.includes(
                                  equipment.value
                                )}
                                onChange={handleCheckboxChange}
                              />
                              <span>{equipment.label}</span>
                            </label>
                          ))}
                        </div>

                        <div className={styles.modalActions}>
                          <button
                            type="button"
                            className={styles.modalDone}
                            onClick={() => setEquipmentOpen(false)}
                          >
                            Done
                            {formData.equipment.length > 0
                              ? ` (${formData.equipment.length} selected)`
                              : ""}
                          </button>
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {/* Preferred workout days */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <CalendarDays size={23} />
                    </span>

                    <div>
                      <h2>Preferred Workout Days</h2>
                      <p>Select the days you prefer to train</p>
                    </div>
                  </div>

                  <CheckboxGroup
                    name="workout_days"
                    options={workoutDayOptions}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.actions}>
              {step === 2 && (
                <button
                  type="button"
                  className={styles.backButton}
                  disabled={loading}
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
              )}

              <button
                type="submit"
                className={styles.continueButton}
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : step === 1
                    ? "Continue"
                    : "Finish"}

                {!loading && <ArrowRight size={21} />}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Onboarding;
