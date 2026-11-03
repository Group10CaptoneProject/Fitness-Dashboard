Run the API from this directory with `uv run backend`. Swagger is available at
http://localhost:8888/docs.

The authenticated `GET /analytics/exercise-recommendation` endpoint returns
exercise names, equipment, target muscles, GIF URLs, sets, reps, and rest seconds.
It uses the user's saved equipment and weekly split, excludes muscle groups
trained within the previous two calendar days, and accepts optional `target_date`,
`goal`, `focus`, and repeated `equipment` query parameters for preview filters.
An empty result includes a message explaining rest days or unmatched filters.

Goal selection ranks the eligible catalog exercises using equipment and movement
names: hypertrophy favors loaded resistance movements, endurance favors
conditioning and bodyweight movements, and general fitness favors compound and
bodyweight movements. These are explicit ranking rules, not a trained model;
the catalog does not provide goal labels. Goals also select different sets,
reps, and rest defaults. Focus filters the eligible muscle groups before the
plan is selected. Limited equipment and recovery exclusions can leave the same
exercises eligible for multiple goals.

The recommendation endpoint reads the latest saved Final Training Score on or before the requested
date using the existing analytics helper. It scales each exercise's total reps
by 1.05, 1.00, 0.90, or 0.75 for scores at least 80, 60, 40, or 20 respectively.
Whole total reps are rounded to the nearest integer and distributed across the
original sets in `reps_by_set`; weights and rest intervals are unchanged. Scores
below 20 return no planned exercises and a rest/gentle activity message. Missing
or invalid scores leave the baseline unchanged, and future-dated scores are excluded.
The response includes `final_training_score`, `readiness_level`, and
`workout_adjustment`, plus the selected `score_date`, so the card and the adjusted plan share the same score.

`EXERCISE_DATA_URL` in `.env` overrides the default public JSON catalog:
https://raw.githubusercontent.com/bootstrapping-lab/exercisedb-api/main/src/data/exercises.json
([catalog source](https://github.com/bootstrapping-lab/exercisedb-api)). Catalogs
can be JSON arrays or wrapped in `data`/`exercises`; exercises must include an
absolute `gifUrl` or `gif_url`. A RapidAPI source also requires
`EXERCISEDB_API_KEY`. Provider failures return HTTP 502 instead of silently
producing an empty plan. The catalog is cached in memory for one hour.

The Training Plan page sends the stored bearer token and displays GIFs directly
from the returned URLs. Its goal, focus, and equipment filters update the preview.
Set `REACT_APP_API_URL` in the frontend environment to override
`http://localhost:8888`.

Run the backend recommendation tests without a live database:

```sh
uv run python -m unittest discover -s src/app/tests -p test_recommendations.py
```
