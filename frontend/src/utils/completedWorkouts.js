export function workoutDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function storageKey(date) {
    let user;
    try {
        const token = localStorage.getItem('access_token') || '';
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        user = JSON.parse(atob(payload)).sub;
    } catch { /* Fall back to the stored account id. */ }
    user = user || localStorage.getItem('user_id');
    return user ? `completed_workouts_${user}_${date}` : null;
}

export function completedWorkouts(date = workoutDate()) {
    const key = storageKey(date);
    if (!key) return [];
    try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(data) ? data : [];
    } catch { return []; }
}

export function completeWorkout(exercise, date = workoutDate()) {
    const key = storageKey(date);
    if (!key) throw new Error('Sign in again to add this exercise to Daily Entry.');
    const workouts = completedWorkouts(date);
    if (!workouts.some(item => item.id === exercise.id || item.name.toLowerCase() === exercise.name.toLowerCase())) {
        workouts.push({ id: exercise.id, name: exercise.name, target_muscle: exercise.target_muscle || [],
            sets: exercise.sets, reps: exercise.reps, reps_by_set: exercise.reps_by_set });
        localStorage.setItem(key, JSON.stringify(workouts));
    }
}

export function removeCompletedWorkout(name, date) {
    const key = storageKey(date);
    if (key) localStorage.setItem(key, JSON.stringify(completedWorkouts(date).filter(item => item.name.toLowerCase() !== name.toLowerCase())));
}

export const workoutMuscleAreas = {
    upper_Body: ['Chest', 'Back', 'Biceps', 'Triceps', 'Shoulders', 'Forearms', 'Neck'],
    lower_Body: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    cardio: ['Abs', 'Cardio'],
};

function workoutMuscles(item) {
    const aliases = {
        pectorals: 'Chest', lats: 'Back', traps: 'Back', spine: 'Back',
        'upper back': 'Back', delts: 'Shoulders', quadriceps: 'Quads',
        abductors: 'Glutes', adductors: 'Quads', 'cardiovascular system': 'Cardio',
        'levator scapulae': 'Neck', 'serratus anterior': 'Chest',
    };
    const targets = Array.isArray(item.target_muscle) ? item.target_muscle : [item.target_muscle];
    const muscleArea = targets.filter(Boolean).map(value => {
        const key = value.trim().toLowerCase();
        return aliases[key] || Object.values(workoutMuscleAreas).flat().find(area => area.toLowerCase() === key);
    }).find(Boolean) || '';
    const muscleGroup = Object.keys(workoutMuscleAreas).find(group => workoutMuscleAreas[group].includes(muscleArea)) || '';
    return { muscleGroup, muscleArea };
}

export function mergeCompletedWorkouts(exercises, date) {
    const result = exercises.map(exercise => ({ ...exercise }));
    for (const item of completedWorkouts(date)) {
        const muscles = workoutMuscles(item);
        const existing = result.find(ex => ex.exercise?.trim().toLowerCase() === item.name.trim().toLowerCase());
        if (existing) {
            existing.reps_by_set = existing.reps_by_set || item.reps_by_set;
            existing.sets = existing.sets ?? item.sets;
            existing.reps = existing.reps ?? item.reps;
            // Fill missing fields without replacing the user's explicit selections.
            if (!existing.muscleGroup || existing.muscleGroup === muscles.muscleGroup) {
                existing.muscleGroup = existing.muscleGroup || muscles.muscleGroup;
                existing.muscleArea = existing.muscleArea || muscles.muscleArea;
            }
            continue;
        }
        result.push({ id: `completed-${item.id}`, exercise: item.name, duration: '', weights: '', difficulty: '',
            ...muscles, sets: item.sets, reps: item.reps, reps_by_set: item.reps_by_set });
    }
    // Replace the untouched placeholder when completed exercises exist.
    return result.length > 1 ? result.filter(ex => ex.exercise || ex.duration || ex.muscleGroup || ex.muscleArea || ex.weights || ex.difficulty !== '') : result;
}
