
import { useState } from "react";
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

function Onboarding() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  // Track the current onboarding step and validation error
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  // Store all onboarding answers in one state object
  const [formData, setFormData] = useState({
    // Step 1
    age: "",
    gender: "",
    height: "",
    weight: "",

    // Step 2
    goal: "",
    experience: "",
    session_duration: "",

    // Checkboxes store multiple selections as arrays
    equipment: [],
    workout_days: [],
  });

    // Controls whether the equipment selection popup is visible
    const [equipmentOpen, setEquipmentOpen] = useState(false);

  // Handle changes to standard inputs and dropdowns.
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  // Handle checkbox selections for equipment and workout days.
  function handleCheckboxChange(event) {
    const { name, value, checked } = event.target;

    setFormData((previous) => {
      const currentValues = previous[name];

      return {
        ...previous,
        [name]: checked
          ? [...currentValues, value]
          : currentValues.filter((item) => item !== value),
      };
    });

    setError("");
  }

  // Reusable dropdown component with a custom ChevronDown icon.
  // The shared CSS class lets every dropdown use the same arrow position.
  function Dropdown({ name, value, onChange, children, required = false }) {
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

  // Render a checkbox group for equipment or workout days
  function CheckboxGroup({ name, options }) {
    return (
      <div className={styles.checkboxGroup}>
        {options.map((option) => (
          <label
            key={option.value}
            className={styles.checkboxOption}
          >
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

  // Validate the current step, then save the answers on completion
  function handleContinue(event) {
    event.preventDefault();
    setError("");

    if (step === 1) {
      // Require all four profile fields
      if (
        !formData.age || !formData.gender || !formData.height || !formData.weight
      ) {
        setError("Please complete all fields before continuing.");
        return;
      }

      // Check that numeric values are within valid ranges.
      if (
        Number(formData.age) < 10 ||
        Number(formData.age) > 120 ||
        Number(formData.height) <= 0 ||
        Number(formData.weight) <= 0
      ) {
        setError("Please enter valid age, height, and weight values.");
        return;
      }

      // Advance to the workout preferences step.
      setStep(2);
      return;
    }

    // Validate the required workout preferences.
    if (
      !formData.goal || !formData.experience || !formData.session_duration || formData.equipment.length === 0 || formData.workout_days.length === 0
    ) {
      setError(
        "Please select your goal, experience, duration, equipment, and workout days."
      );
      return;
    }

    // Save the completed onboarding data locally for now.
    localStorage.setItem(
      "onboarding_data",
      JSON.stringify(formData)
    );

    localStorage.setItem("onboarding_completed", "true");

    // Navigate to the entry after onboarding.
    navigate("/entry");
  }

  return (
    <div className={styles.page}>
        {/* Top navigation bar */}
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
            {/* Page heading */}
            <div className={styles.heading}>
            <h1>Let’s get to know you</h1>

            <p>
                This information helps us personalize your fitness experience and create the best training plan for you
            </p>
            </div>

        <section className={styles.card}>
          {/* Progress indicator for the two onboarding steps */}
          <div className={styles.progressSection}>
            <span className={styles.stepLabel}>
              Step {step} of 2
            </span>

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
              /* Step 1 */
              <div className={styles.fieldsGrid}>
                {/* Age input */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <CalendarDays size={23} />
                    </span>

                    <div>
                      <h2>Age</h2>
                      <p>
                        Used for basic health analytics and future personalization
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
                      min="10"
                      max="120"
                      required
                    />

                    <span className={styles.unit}>years old</span>
                  </div>
                </div>

                {/* Gender dropdown */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <UsersRound size={24} />
                    </span>

                    <div>
                      <h2>Gender</h2>
                      <p>
                        Used as optional profile information and for health-related analytics
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
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </Dropdown>
                </div>

                {/* Height input */}
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
                      min="1"
                      step="0.1"
                      required
                    />

                    <span className={styles.unit}>cm</span>
                  </div>
                </div>

                {/* Weight input */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Weight size={23} />
                    </span>

                    <div>
                      <h2>Weight</h2>
                      <p>
                        Used with height for body-weight-related analytics and progress tracking
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
                      min="1"
                      step="0.1"
                      required
                    />

                    <span className={styles.unit}>lb</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2 */
              <div className={styles.fieldsGrid}>
                {/* Primary fitness goal dropdown */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Target size={23} />
                    </span>

                    <div>
                      <h2>Primary Goal</h2>
                      <p>
                        What would you most like to achieve?
                      </p>
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
                    <option value="hypertrophy">Hypertrophy (Muscle Growth)</option>
                    <option value="strength">Strength</option>
                    <option value="weight_loss">Weight Loss</option>
                    <option value="endurance">Endurance</option>
                    <option value="general_fitness">General Fitness</option>
                  </Dropdown>
                </div>

                {/* Experience level dropdown */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Dumbbell size={23} />
                    </span>

                    <div>
                      <h2>Experience Level</h2>
                      <p>
                        Help us personalize your training plan
                      </p>
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

                {/* Preferred workout duration dropdown */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <Clock size={23} />
                    </span>

                    <div>
                      <h2>Preferred Workout Duration</h2>
                      <p>
                        How long is your typical workout?
                      </p>
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
                    <option value="10">10 min</option>
                    <option value="20">20 min</option>
                    <option value="30">30 min</option>
                    <option value="40">40 min</option>
                    <option value="50">50 min</option>
                    <option value="60">60 min</option>
                    <option value="70">70 min</option>
                    <option value="80">80 min</option>
                    <option value="90">90 min</option>
                    <option value="100">100 min</option>
                    <option value="110">110 min</option>
                    <option value="120">120 min</option>
                    <option value="130">130 min</option>
                    <option value="140">140 min</option>
                    <option value="150">150 min</option>
                    <option value="160">160 min</option>
                    <option value="170">170 min</option>
                    <option value="180">180 min</option>
                  </Dropdown>
                </div>
                
                {/* Equipment selection button and popup */}
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

                {/* Clicking this button opens the equipment popup. */}
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

                {/* Popup overlay with all available equipment options. */}
                {equipmentOpen && (
                    <div
                    className={styles.modalOverlay}
                    onClick={(event) => {
                        // Close only when the user clicks the overlay itself.
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

                        {/* Close popup without clearing selections. */}
                        <button
                            type="button"
                            className={styles.modalClose}
                            onClick={() => setEquipmentOpen(false)}
                            aria-label="Close equipment selection"
                        >
                            ×
                        </button>
                        </div>

                        {/* These checkboxes update the existing React form state. */}

                        <div className={styles.modalOptions}>
                        {[
                            { label: "Bodyweight", value: "bodyweight" },
                            { label: "Dumbbells", value: "dumbbells" },
                            { label: "Kettlebells", value: "kettlebells" },
                            { label: "Resistance Bands", value: "resistance_bands" },
                            { label: "Barbell", value: "barbell" },
                        ].map((equipment) => (
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

                        {/* Close the popup and keep the user's selections. */}
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

                {/* Preferred workout days using weekday checkboxes */}
                <div className={styles.field}>
                  <div className={styles.fieldHeading}>
                    <span className={styles.iconCircle}>
                      <CalendarDays size={23} />
                    </span>

                    <div>
                      <h2>Preferred Workout Days</h2>
                      <p>
                        Select the days you prefer to train
                      </p>
                    </div>
                  </div>

                  <CheckboxGroup
                    name="workout_days"
                    options={[
                      { label: "Mon", value: "Monday" },
                      { label: "Tue", value: "Tuesday" },
                      { label: "Wed", value: "Wednesday" },
                      { label: "Thu", value: "Thursday" },
                      { label: "Fri", value: "Friday" },
                      { label: "Sat", value: "Saturday" },
                      { label: "Sun", value: "Sunday" },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Display validation errors when needed */}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            {/* Back and Continue/Finish buttons */}
            <div className={styles.actions}>
              {step === 2 && (
                <button
                  type="button"
                  className={styles.backButton}
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
              >
                {step === 1 ? "Continue" : "Finish"}
                <ArrowRight size={21} />
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Onboarding;
