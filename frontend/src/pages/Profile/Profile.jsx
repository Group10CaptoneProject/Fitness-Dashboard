import { useEffect, useState } from "react";
import { User, Pencil, Eye, EyeOff, Dumbbell, ChevronDown } from "lucide-react";
import styles from "./Profile.module.css";
import MainNav from "../../component/MainNavBar/MainNav";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8888").replace(/\/+$/, "");
const ACCOUNT_API_URL = `${API_URL}/profile/account`;
const PASSWORD_API_URL = `${API_URL}/profile/change-password`;
const FITNESS_API_URL = `${API_URL}/profile/fitness-profile`;
const USER_PROFILE_API_URL = `${API_URL}/profile/user-profile`;

const REQUEST_TIMEOUT_MS = 20000;

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

// Parse backend responses and display readable errors.
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

// Headers that include the logged in user's token
function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Keep the saved username in sync so the other pages show the new name
function storeUsername(newUsername) {
  localStorage.setItem("username", newUsername);

  if (localStorage.getItem("user_name") !== null) {
    localStorage.setItem("user_name", newUsername);
  }
}

// Options match the Onboarding page
const genderOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const goalOptions = [
  { value: "hypertrophy", label: "Hypertrophy (Muscle Growth)" },
  { value: "endurance", label: "Endurance" },
  { value: "healthy_lifestyle", label: "Healthy Lifestyle" },
];

const experienceOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const equipmentOptions = [
  { value: "bodyweight", label: "Bodyweight" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "resistance_bands", label: "Resistance Bands" },
  { value: "barbell", label: "Barbell" },
];

const workoutDayOptions = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

// Workout durations: 10 to 180 minutes
const baseDurationOptions = Array.from({ length: 18 }, (_, index) => {
  const minutes = (index + 1) * 10;

  return { value: String(minutes), label: `${minutes} min` };
});

const emptyProfile = {
  age: "",
  gender: "",
  height: "",
  weight: "",
  goal: "",
  experience: "",
  session_duration: "",
  equipment: [],
  workout_days: [],
};

// Turn the two backend profile responses into the form's shape
function toProfileForm(fitnessData, profileData) {
  const asText = (value) => (value == null ? "" : String(value));

  return {
    age: asText(fitnessData.age),
    gender: fitnessData.gender || "",
    height: asText(fitnessData.height),
    weight: asText(fitnessData.weight),
    goal: profileData.primary_goal || "",
    experience: profileData.experience_level || "",
    session_duration: asText(profileData.session_duration),
    equipment: Array.isArray(profileData.equipment_available)
      ? profileData.equipment_available
      : [],
    workout_days: Array.isArray(profileData.preferred_workout_days)
      ? profileData.preferred_workout_days
      : [],
  };
}

// Used to tell whether the form differs from what was last saved
function serializeProfile(form) {
  return JSON.stringify({
    ...form,
    equipment: [...form.equipment].sort(),
    workout_days: [...form.workout_days].sort(),
  });
}

// Onboarding restores its answers from this shape (days start with a capital)
function toOnboardingData(form) {
  return {
    ...form,
    workout_days: form.workout_days.map(
      (day) => day.charAt(0).toUpperCase() + day.slice(1)
    ),
  };
}

function formatMemberSince(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Dropdown with a custom arrow
function SelectField({ id, name, value, onChange, options, placeholder }) {
  return (
    <div className={styles.selectWrapper}>
      <select id={id} name={name} value={value} onChange={onChange}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        className={styles.selectIcon}
        size={18}
        aria-hidden="true"
      />
    </div>
  );
}

// Checkbox options shown as selectable buttons
function ChipGroup({ name, options, selected, onChange }) {
  return (
    <div className={styles.chipGroup}>
      {options.map((option) => (
        <label key={option.value} className={styles.chip}>
          <input
            type="checkbox"
            name={name}
            value={option.value}
            checked={selected.includes(option.value)}
            onChange={onChange}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function Profile() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") ||
      localStorage.getItem("user_name") ||
      localStorage.getItem("name") ||
      "Username"
  );

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Account information
  const [account, setAccount] = useState({
    username: "",
    email: "",
    created_at: "",
  });

  // Username editing
  const [usernameEditing, setUsernameEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameMessage, setUsernameMessage] = useState({
    type: "",
    text: "",
  });
  const [savingUsername, setSavingUsername] = useState(false);

  // Password editing
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile information
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(emptyProfile);
  const [profileMessage, setProfileMessage] = useState({
    type: "",
    text: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const profileChanged =
    serializeProfile(profileForm) !== serializeProfile(savedProfile);

  // Keep a saved value in the list even if it is not a multiple of 10
  const durationOptions =
    profileForm.session_duration &&
    !baseDurationOptions.some(
      (option) => option.value === profileForm.session_duration
    )
      ? [
          ...baseDurationOptions,
          {
            value: profileForm.session_duration,
            label: `${profileForm.session_duration} min`,
          },
        ].sort((a, b) => Number(a.value) - Number(b.value))
      : baseDurationOptions;

  // Load the account and profile information from the backend
  useEffect(() => {
    let cancelled = false;

    async function loadProfilePage() {
      try {
        const headers = getAuthHeaders();

        const [accountResponse, fitnessResponse, profileResponse] =
          await Promise.all([
            fetchWithTimeout(ACCOUNT_API_URL, { method: "GET", headers }),
            fetchWithTimeout(FITNESS_API_URL, { method: "GET", headers }),
            fetchWithTimeout(USER_PROFILE_API_URL, {
              method: "GET",
              headers,
            }),
          ]);

        const accountData = await readResponse(
          accountResponse,
          "Could not load your account information."
        );
        const fitnessData = await readResponse(
          fitnessResponse,
          "Could not load your fitness information."
        );
        const profileData = await readResponse(
          profileResponse,
          "Could not load your workout preferences."
        );

        if (cancelled) return;

        const form = toProfileForm(fitnessData, profileData);

        setAccount({
          username: accountData.username,
          email: accountData.email,
          created_at: accountData.created_at,
        });
        setUsername(accountData.username);
        setProfileForm(form);
        setSavedProfile(form);
        setPageError("");
      } catch (loadError) {
        console.error("Profile load error:", loadError);

        if (!cancelled) {
          setPageError(
            loadError.message || "Could not load your profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfilePage();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close the equipment popup with the Escape key and stop the page behind it from scrolling
  useEffect(() => {
    if (!equipmentOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setEquipmentOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [equipmentOpen]);

  // Username
  function startEditingUsername() {
    setUsernameInput(account.username);
    setUsernameMessage({ type: "", text: "" });
    setUsernameEditing(true);
  }

  function cancelEditingUsername() {
    setUsernameEditing(false);
    setUsernameMessage({ type: "", text: "" });
  }

  async function handleSaveUsername(event) {
    event.preventDefault();

    if (savingUsername) return;

    const newUsername = usernameInput.trim();

    if (newUsername.length < 3 || newUsername.length > 50) {
      setUsernameMessage({
        type: "error",
        text: "Username must be between 3 and 50 characters.",
      });
      return;
    }

    if (newUsername === account.username) {
      cancelEditingUsername();
      return;
    }

    setSavingUsername(true);
    setUsernameMessage({ type: "", text: "" });

    try {
      const response = await fetchWithTimeout(ACCOUNT_API_URL, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: newUsername }),
      });

      const updated = await readResponse(
        response,
        "Could not update your username."
      );

      setAccount((previous) => ({
        ...previous,
        username: updated.username,
      }));
      setUsername(updated.username);
      storeUsername(updated.username);
      setUsernameEditing(false);
      setUsernameMessage({ type: "success", text: "Username updated." });
    } catch (saveError) {
      console.error("Username save error:", saveError);

      setUsernameMessage({
        type: "error",
        text: saveError.message || "Could not update your username.",
      });
    } finally {
      setSavingUsername(false);
    }
  }

  // Password
  function openPasswordPanel() {
    setPasswordForm({ current: "", next: "", confirm: "" });
    setShowPasswords(false);
    setPasswordMessage({ type: "", text: "" });
    setPasswordOpen(true);
  }

  function closePasswordPanel() {
    setPasswordOpen(false);
    setPasswordForm({ current: "", next: "", confirm: "" });
    setPasswordMessage({ type: "", text: "" });
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setPasswordMessage({ type: "", text: "" });
  }

  async function handleSavePassword(event) {
    event.preventDefault();

    if (savingPassword) return;

    if (
      !passwordForm.current ||
      !passwordForm.next ||
      !passwordForm.confirm
    ) {
      setPasswordMessage({
        type: "error",
        text: "Please fill in all password fields.",
      });
      return;
    }

    if (passwordForm.next.length < 6 || passwordForm.next.length > 255) {
      setPasswordMessage({
        type: "error",
        text: "New password must be between 6 and 255 characters.",
      });
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    if (passwordForm.next === passwordForm.current) {
      setPasswordMessage({
        type: "error",
        text: "New password must be different from your current password.",
      });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage({ type: "", text: "" });

    try {
      const response = await fetchWithTimeout(PASSWORD_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.next,
        }),
      });

      await readResponse(response, "Could not update your password.");

      setPasswordOpen(false);
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordMessage({ type: "success", text: "Password updated." });
    } catch (saveError) {
      console.error("Password save error:", saveError);

      setPasswordMessage({
        type: "error",
        text: saveError.message || "Could not update your password.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  // Profile information
  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setProfileMessage({ type: "", text: "" });
  }

  // Update equipment and workout-day checkboxes.
  function handleProfileCheckbox(event) {
    const { name, value, checked } = event.target;

    setProfileForm((previous) => {
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
    setProfileMessage({ type: "", text: "" });
  }

  function handleDiscardProfile() {
    setProfileForm(savedProfile);
    setProfileMessage({ type: "", text: "" });
  }

  function validateProfile() {
    if (
      !profileForm.age ||
      !profileForm.gender ||
      !profileForm.height ||
      !profileForm.weight ||
      !profileForm.goal ||
      !profileForm.experience ||
      !profileForm.session_duration
    ) {
      return "Please complete all fields before saving.";
    }

    const age = Number(profileForm.age);
    const height = Number(profileForm.height);
    const weight = Number(profileForm.weight);

    if (
      !Number.isInteger(age) ||
      !Number.isInteger(height) ||
      !Number.isInteger(weight) ||
      age < 12 ||
      age > 120 ||
      height < 50 ||
      height > 250 ||
      weight < 20 ||
      weight > 300
    ) {
      return "Please enter a whole-number age (12–120), height (50–250 cm), and weight (20–300 lb).";
    }

    const duration = Number(profileForm.session_duration);

    if (!Number.isInteger(duration) || duration < 10 || duration > 180) {
      return "Workout duration must be between 10 and 180 minutes.";
    }

    if (profileForm.equipment.length === 0) {
      return "Please select at least one piece of equipment.";
    }

    if (profileForm.workout_days.length === 0) {
      return "Please select at least one workout day.";
    }

    return "";
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (savingProfile) return;

    const validationError = validateProfile();

    if (validationError) {
      setProfileMessage({ type: "error", text: validationError });
      return;
    }

    setSavingProfile(true);
    setProfileMessage({ type: "", text: "" });

    try {
      const headers = getAuthHeaders();

      const fitnessProfile = {
        age: Number(profileForm.age),
        gender: profileForm.gender,
        height: Number(profileForm.height),
        weight: Number(profileForm.weight),
      };

      const userProfile = {
        primary_goal: profileForm.goal,
        experience_level: profileForm.experience,
        equipment_available: profileForm.equipment,
        preferred_workout_days: profileForm.workout_days,
        session_duration: Number(profileForm.session_duration),
      };

      const fitnessResponse = await fetchWithTimeout(FITNESS_API_URL, {
        method: "PATCH",
        headers,
        body: JSON.stringify(fitnessProfile),
      });
      await readResponse(
        fitnessResponse,
        "Could not save your fitness information."
      );

      const preferencesResponse = await fetchWithTimeout(
        USER_PROFILE_API_URL,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(userProfile),
        }
      );
      await readResponse(
        preferencesResponse,
        "Could not save your workout preferences."
      );

      setSavedProfile(profileForm);

      // Keep the Onboarding page's saved answers in sync
      localStorage.setItem(
        "onboarding_data",
        JSON.stringify(toOnboardingData(profileForm))
      );

      setProfileMessage({
        type: "success",
        text: "Profile information saved.",
      });
    } catch (saveError) {
      console.error("Profile save error:", saveError);

      setProfileMessage({
        type: "error",
        text:
          saveError.message || "Unable to save your profile information.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className={styles.page}>
      <MainNav username={username} />

      <main className={styles.main}>
        <div className={styles.pageHeading}>
          <h1>Profile</h1>
          <p>Manage your account details and your fitness information</p>
        </div>

        {pageError && (
          <p className={styles.pageError} role="alert">
            {pageError}
          </p>
        )}

        {/* Account information */}
        <section
          className={styles.card}
          aria-labelledby="account-title"
        >
          <div className={styles.cardHeading}>
            <span className={styles.iconBadge}>
              <User size={22} />
            </span>

            <div>
              <h2 id="account-title">Account information</h2>
              <p>Your personal account details</p>
            </div>
          </div>

          {loading ? (
            <p className={styles.loadingText}>Loading your account...</p>
          ) : (
            <>
              <div className={styles.infoGrid}>
                {/* Username */}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Username</span>

                  {usernameEditing ? (
                    <form
                      className={styles.inlineForm}
                      onSubmit={handleSaveUsername}
                      noValidate
                    >
                      <input
                        type="text"
                        name="username"
                        value={usernameInput}
                        onChange={(event) => {
                          setUsernameInput(event.target.value);
                          setUsernameMessage({ type: "", text: "" });
                        }}
                        maxLength={50}
                        autoComplete="username"
                        aria-label="Username"
                        autoFocus
                      />

                      <div className={styles.buttonRow}>
                        <button
                          type="submit"
                          className={styles.primaryButton}
                          disabled={savingUsername}
                        >
                          {savingUsername ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={cancelEditingUsername}
                          disabled={savingUsername}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.infoValueRow}>
                      <span className={styles.infoValue}>
                        {account.username || "—"}
                      </span>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={startEditingUsername}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                    </div>
                  )}

                  {usernameMessage.text && (
                    <p
                      className={
                        usernameMessage.type === "error"
                          ? styles.messageError
                          : styles.messageSuccess
                      }
                      role={
                        usernameMessage.type === "error" ? "alert" : "status"
                      }
                    >
                      {usernameMessage.text}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email address</span>
                  <div className={styles.infoValueRow}>
                    <span className={styles.infoValue}>
                      {account.email || "—"}
                    </span>
                  </div>
                </div>

                {/* Member since */}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Member since</span>
                  <div className={styles.infoValueRow}>
                    <span className={styles.infoValue}>
                      {formatMemberSince(account.created_at)}
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Password</span>
                  <div className={styles.infoValueRow}>
                    <span className={styles.infoValue}>••••••••</span>
                    {!passwordOpen && (
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={openPasswordPanel}
                      >
                        <Pencil size={15} />
                        Change
                      </button>
                    )}
                  </div>

                  {!passwordOpen && passwordMessage.text && (
                    <p
                      className={
                        passwordMessage.type === "error"
                          ? styles.messageError
                          : styles.messageSuccess
                      }
                      role={
                        passwordMessage.type === "error" ? "alert" : "status"
                      }
                    >
                      {passwordMessage.text}
                    </p>
                  )}
                </div>
              </div>

              {passwordOpen && (
                <form
                  className={styles.passwordPanel}
                  onSubmit={handleSavePassword}
                  noValidate
                >
                  <div className={styles.passwordPanelHeading}>
                    <h3>Change password</h3>

                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => setShowPasswords((previous) => !previous)}
                      aria-pressed={showPasswords}
                    >
                      {showPasswords ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                      {showPasswords ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className={styles.passwordGrid}>
                    <div className={styles.field}>
                      <label htmlFor="current-password">
                        Current password
                      </label>
                      <input
                        id="current-password"
                        type={showPasswords ? "text" : "password"}
                        name="current"
                        value={passwordForm.current}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        maxLength={255}
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="new-password">New password</label>
                      <input
                        id="new-password"
                        type={showPasswords ? "text" : "password"}
                        name="next"
                        value={passwordForm.next}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        minLength={6}
                        maxLength={255}
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="confirm-password">
                        Confirm new password
                      </label>
                      <input
                        id="confirm-password"
                        type={showPasswords ? "text" : "password"}
                        name="confirm"
                        value={passwordForm.confirm}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        minLength={6}
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <p className={styles.hint}>
                    Use 6 to 255 characters.
                  </p>

                  {passwordMessage.text && (
                    <p
                      className={
                        passwordMessage.type === "error"
                          ? styles.messageError
                          : styles.messageSuccess
                      }
                      role={
                        passwordMessage.type === "error" ? "alert" : "status"
                      }
                    >
                      {passwordMessage.text}
                    </p>
                  )}

                  <div className={styles.buttonRow}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={savingPassword}
                    >
                      {savingPassword ? "Saving..." : "Update password"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={closePasswordPanel}
                      disabled={savingPassword}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>

        {/* Profile information */}
        <section
          className={styles.card}
          aria-labelledby="profile-info-title"
        >
          <div className={styles.cardHeading}>
            <span className={styles.iconBadge}>
              <Dumbbell size={22} />
            </span>

            <div>
              <h2 id="profile-info-title">Profile information</h2>
              <p>Your fitness details and training preferences</p>
            </div>
          </div>

          {loading ? (
            <p className={styles.loadingText}>
              Loading your profile information...
            </p>
          ) : (
            <form onSubmit={handleSaveProfile} noValidate>
              <h3 className={styles.subHeading}>Body measurements</h3>

              <div className={styles.fieldsGrid}>
                <div className={styles.field}>
                  <label htmlFor="age">Age</label>
                  <div className={styles.inputRow}>
                    <input
                      id="age"
                      type="number"
                      name="age"
                      placeholder="Enter Age"
                      value={profileForm.age}
                      onChange={handleProfileChange}
                      min="12"
                      max="120"
                      step="1"
                    />
                    <span className={styles.unit}>years</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="gender">Gender</label>
                  <SelectField
                    id="gender"
                    name="gender"
                    value={profileForm.gender}
                    onChange={handleProfileChange}
                    options={genderOptions}
                    placeholder="Select Gender"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="height">Height</label>
                  <div className={styles.inputRow}>
                    <input
                      id="height"
                      type="number"
                      name="height"
                      placeholder="Enter Height"
                      value={profileForm.height}
                      onChange={handleProfileChange}
                      min="50"
                      max="250"
                      step="1"
                    />
                    <span className={styles.unit}>cm</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="weight">Weight</label>
                  <div className={styles.inputRow}>
                    <input
                      id="weight"
                      type="number"
                      name="weight"
                      placeholder="Enter Weight"
                      value={profileForm.weight}
                      onChange={handleProfileChange}
                      min="20"
                      max="300"
                      step="1"
                    />
                    <span className={styles.unit}>lb</span>
                  </div>
                </div>
              </div>

              <h3 className={styles.subHeading}>Training preferences</h3>

              <div className={styles.fieldsGrid}>
                <div className={styles.field}>
                  <label htmlFor="goal">Primary goal</label>
                  <SelectField
                    id="goal"
                    name="goal"
                    value={profileForm.goal}
                    onChange={handleProfileChange}
                    options={goalOptions}
                    placeholder="Select Your Goal"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="experience">Experience level</label>
                  <SelectField
                    id="experience"
                    name="experience"
                    value={profileForm.experience}
                    onChange={handleProfileChange}
                    options={experienceOptions}
                    placeholder="Select Experience"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="session_duration">
                    Preferred workout duration
                  </label>
                  <SelectField
                    id="session_duration"
                    name="session_duration"
                    value={profileForm.session_duration}
                    onChange={handleProfileChange}
                    options={durationOptions}
                    placeholder="Select Workout Duration"
                  />
                </div>

                {/* Equipment selection */}
                <div className={styles.field}>
                  <span className={styles.groupLabel}>
                    Equipment available
                  </span>

                  <button
                    type="button"
                    className={styles.equipmentButton}
                    onClick={() => setEquipmentOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={equipmentOpen}
                  >
                    <span>
                      {profileForm.equipment.length > 0
                        ? `${profileForm.equipment.length} selected`
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
                                checked={profileForm.equipment.includes(
                                  equipment.value
                                )}
                                onChange={handleProfileCheckbox}
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
                            {profileForm.equipment.length > 0
                              ? ` (${profileForm.equipment.length} selected)`
                              : ""}
                          </button>
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.fieldFull}>
                <span className={styles.groupLabel}>
                  Preferred workout days
                </span>
                <ChipGroup
                  name="workout_days"
                  options={workoutDayOptions}
                  selected={profileForm.workout_days}
                  onChange={handleProfileCheckbox}
                />
              </div>

              {profileMessage.text && (
                <p
                  className={
                    profileMessage.type === "error"
                      ? styles.messageError
                      : styles.messageSuccess
                  }
                  role={profileMessage.type === "error" ? "alert" : "status"}
                >
                  {profileMessage.text}
                </p>
              )}

              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleDiscardProfile}
                  disabled={!profileChanged || savingProfile}
                >
                  Discard changes
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={!profileChanged || savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;