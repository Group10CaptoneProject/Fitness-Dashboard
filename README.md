# Fitness Dashboard

Fitness Dashboard is a full-stack web application designed to help users understand their training readiness, recovery, fatigue, and workload.

The application collects daily fitness and wellness data, calculates training-related scores, visualizes recent trends, and generates personalized training plans based on the user's current condition and fitness goals.

## Features

- User registration and login
- JWT-based authentication
- Protected frontend and backend routes
- User onboarding and fitness profile setup
- User profile management
- Daily fitness check-ins
- Recovery score calculation
- Fatigue score calculation
- Workload balance calculation
- Final training score
- Readiness level
- 7-day training trend visualization
- Analytics charts
- Personalized weekly training plans
- Automatic training intensity adjustments
- Responsive navigation

## Dashboard

The dashboard gives users a quick overview of their current training condition.

It includes:

- Final Training Score
- Recovery Score
- Fatigue Score
- Workload Balance Score
- Readiness Level
- Today's Summary
- Past 7-Day Training Trend

The dashboard retrieves data from the backend using the authenticated user's JWT token.

## Daily Check-In

Users can enter daily wellness and workout information, including:

- Sleep quality
- Energy level
- Soreness
- Stress
- Heart rate
- Workout duration
- Perceived workout difficulty
- Muscle category
- Muscle group
- Exercise information

This information is used to calculate the user's daily training scores.

## Training Scores

### Recovery Score

Recovery is calculated using sleep quality and energy level.

```text id="recovery-formula"
Recovery Score = (Sleep Quality + Energy Level) × 5
```

### Fatigue Score

Fatigue uses soreness and stress.

The score is inverted so that higher soreness and stress result in a lower contribution toward the final training score.

```text id="fatigue-formula"
Fatigue Score = 100 - 5(Soreness + Stress)
```

### Workload Balance Score

Workout duration and perceived difficulty are used to estimate workload.

```text id="workload-formula"
Workload Balance Score =
(Duration / 180) × (Difficulty / 10) × 100
```

### Final Training Score

The final score combines recovery, fatigue, and workload.

```text id="final-score-formula"
Final Training Score =
(Recovery + Fatigue + Workload Balance) / 3
```

The final score is then used to determine the user's readiness level and workout adjustment.

## Analytics

The Analytics page provides charts and visualizations that help users understand how their training changes over time.

The page can display metrics such as:

- Recovery Score
- Fatigue Score
- Workload Balance Score
- Final Training Score
- Training trends over time
- Recovery trends
- Workload trends

Analytics data is retrieved from the backend and displayed through frontend chart components.

The backend also contains an `analytics.py` module responsible for calculations and data processing used by the dashboard and analytics features.

## Profile

The Profile page allows users to view and manage personal and fitness-related information used to personalize their experience.

Profile information can include:

- Primary fitness goal
- Experience level
- Available equipment
- Preferred workout days
- Age
- Gender
- Height
- Weight
- Weekly workout preferences

The backend contains protected profile routes in `profile.py`.

JWT authentication ensures users can only retrieve and modify information associated with their own account.

## Training Plan

The Training Plan page provides a personalized weekly workout schedule.

Each day can include:

- Workout type
- Sets
- Repetitions
- Weight
- Duration
- Rest time
- Intensity percentage

Training intensity can automatically adjust based on the user's most recent training score, readiness level, and workout history.

A typical weekly plan may contain:

```text id="weekly-plan-example"
Monday     Upper Body
Tuesday    Lower Body
Wednesday  Recovery / Rest
Thursday   Upper Body
Friday     Lower Body
Saturday   Cardio / Core
Sunday     Recovery / Rest
```

## Tech Stack

### Frontend

- React
- JavaScript
- React Router
- CSS Modules
- Lucide React
- MUI
- MUI X Charts

### Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy 2
- Pydantic
- Pandas
- JWT Authentication

### Database

- PostgreSQL
- Neon PostgreSQL
- asyncpg

## Project Structure

```text id="project-structure"
Fitness-Dashboard/
│
├── backend/
│   └── src/
│       └── app/
│           │
│           ├── routers/
│           │   ├── auth.py
│           │   ├── dashboard.py
│           │   ├── profile.py
│           │   └── ...
│           │
│           ├── analytics.py
│           ├── db.py
│           ├── schema.py
│           ├── security.py
│           └── main.py
│
├── frontend/
│   └── src/
│       │
│       ├── component/
│       │   ├── MainNavBar/
│       │   └── ...
│       │
│       ├── pages/
│       │   ├── Dashboard/
│       │   ├── DailyEntry/
│       │   ├── TrainingPlan/
│       │   ├── Analytics/
│       │   ├── Profile/
│       │   ├── Login/
│       │   ├── Register/
│       │   └── ...
│       │
│       ├── auth/
│       └── main.jsx
│
├── README.md
├── THIRD_PARTY_LICENSES.md
└── ...
```

## Running the Project Locally

### Backend

Navigate to the backend directory:

```bash id="backend-cd"
cd backend
```

Install dependencies:

```bash id="backend-install"
uv sync
```

Start the FastAPI server:

```bash id="backend-start"
uv run backend
```

The backend should run at:

```text id="backend-url"
http://localhost:8888
```

FastAPI documentation is available at:

```text id="swagger-url"
http://localhost:8888/docs
```

## Frontend

Navigate to the frontend directory:

```bash id="frontend-cd"
cd frontend
```

Install dependencies:

```bash id="frontend-install"
npm install
```

Start the frontend development server:

```bash id="frontend-start"
npm start
```

Open the local URL shown in the terminal.

## Environment Variables

The backend requires environment variables for sensitive configuration.

Example:

```text id="env-example"
DATABASE_URL=
SECRET_KEY=
```

Environment files should never be committed to GitHub.

Make sure `.env` is included in `.gitignore`.

Example:

```text id="gitignore-example"
backend/.env
.env
```


## Authentication

The application uses JWT authentication.

After a successful login, the backend returns an access token.

The frontend stores the token in local storage:

```javascript id="store-token"
localStorage.setItem("access_token", data.access_token);
```

Protected frontend requests send the token through the `Authorization` header:

```text id="authorization-header"
Authorization: Bearer <access_token>
```

FastAPI protected routes use the token to determine the currently authenticated user.

For example:

```python id="protected-route-example"
current_user: User = Depends(get_current_user)
```

The user's ID can then be retrieved securely from:

```python id="current-user-id"
current_user.user_id
```

This prevents the frontend from having to decide which user's protected data should be loaded.

## Dashboard API

The dashboard currently uses protected routes.

### Dashboard Data

```text id="dashboard-endpoint"
GET /dashboard/
```

This route can return information such as:

- User profile
- Fitness profile
- Recent daily entries
- Readiness information

### Daily Scores

```text id="dashboard-scores-endpoint"
GET /dashboard/scores
```

This route returns score history for the authenticated user.

Example response:

```json id="score-response-example"
[
  {
    "score_date": "2026-10-24",
    "recovery": 70,
    "fatigue": 65,
    "workload_balance_score": 72,
    "final_training_score": 69,
    "readiness_level": "Normal",
    "workout_adjustment": "Maintain"
  },
  {
    "score_date": "2026-10-25",
    "recovery": 80,
    "fatigue": 75,
    "workload_balance_score": 78,
    "final_training_score": 78,
    "readiness_level": "Good",
    "workout_adjustment": "Increase"
  }
]
```

## Frontend Dashboard Request

The React dashboard retrieves the user's JWT from local storage and sends it to the backend.

Example:

```javascript id="dashboard-fetch-example"
const token = localStorage.getItem("access_token");

const response = await fetch(
  "http://localhost:8888/dashboard/scores",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();
```

The returned data can then be used for dashboard cards and charts.

Example:

```javascript id="dashboard-score-state"
setWeeklyScores(data);

if (data.length > 0) {
  const latestScore = data[data.length - 1];

  setTrainingScore(
    Number(latestScore.final_training_score)
  );

  setRecoveryScore(
    Number(latestScore.recovery)
  );

  setFatigueScore(
    Number(latestScore.fatigue)
  );

  setWorkloadScore(
    Number(latestScore.workload_balance_score)
  );
}
```

## API Examples

### Authentication

```text id="authentication-routes"
POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/verify-reset-code
POST /auth/reset-password
```

### Dashboard

```text id="dashboard-routes"
GET /dashboard/
GET /dashboard/scores
```

### Profile

Profile endpoints are protected and use the authenticated user's JWT token.

Example route structure:

```text id="profile-routes"
GET /profile
PUT /profile

GET /fitness-profile
PUT /fitness-profile
```

The exact endpoint paths depend on the router prefixes defined in the backend.

## Security

The project uses:

- Password hashing
- JWT access tokens
- Token expiration
- Protected frontend routes
- Protected FastAPI routes
- User-specific database queries
- Environment variables for sensitive configuration
- CORS configuration

Sensitive values such as database passwords and JWT secret keys should never be committed to GitHub.

## Database

The application uses PostgreSQL through Neon.

SQLAlchemy is used as the ORM layer between FastAPI and PostgreSQL.

Core database models include:

- User
- UserProfile
- UserFitnessProfile
- DailyEntry
- DailyScore
- Training Plan data

The application uses asynchronous database sessions through SQLAlchemy and `asyncpg`.

## Analytics Processing

The backend `analytics.py` module handles calculations and transformation of fitness data.

For example, daily score information can be retrieved as a Pandas DataFrame:

```python id="daily-score-function"
async def get_daily_score(user_id: uuid.UUID) -> pd.DataFrame:
    async with async_session_maker() as session:
        daily_score_data = (
            select(DailyScore)
            .where(DailyScore.user_id == user_id)
            .order_by(DailyScore.score_date.asc())
        )

        score_result = await session.execute(daily_score_data)
        scores = score_result.scalars().all()

        return pd.DataFrame([
            {
                "score_date": score.score_date,
                "recovery": score.recovery,
                "fatigue": score.fatigue,
                "workload_balance_score": score.workload_balance_score,
                "final_training_score": score.final_training_score,
                "readiness_level": score.readiness_level,
                "workout_adjustment": score.workout_adjustment
            }
            for score in scores
        ])
```

This data can then be returned through FastAPI and used by frontend charts.

## Future Improvements

Possible future improvements include:

- Daily check-in activity heatmap
- Multi-year activity history
- Additional analytics charts
- Longer-term training trends
- More advanced training-plan recommendations
- Workout prediction
- Improved profile editing
- Improved mobile responsiveness
- Production deployment
- More detailed workout history
- Notifications and reminders

## Third-Party Libraries

This project uses third-party open-source libraries.

License notices for applicable dependencies can be stored in:

```text id="third-party-license-file"
THIRD_PARTY_LICENSES.md
```

If `react-calendar-heatmap` is added to the project, its MIT license notice should be included in that file.

Example:

```text id="heatmap-license"
react-calendar-heatmap

Source:
https://www.npmjs.com/package/react-calendar-heatmap

Licensed under the MIT License.
```

## Team

Developed as a Computer Science Capstone project.

### Contributors

- Leo Zheng
- Ryan Lui
- Ying Shan Li

## License

This project is intended for educational and academic use.