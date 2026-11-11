export function intensityFactor(score) {
    if (score === null || score === undefined || score === '' || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) return null;
    const value = Number(score);
    return value >= 80 ? 1.05 : value >= 60 ? 1 : value >= 40 ? 0.9 : value >= 20 ? 0.75 : 0;
}

export function adjustExercise(exercise, factor) {
    if (factor === null) return exercise;
    const sets = Number(exercise.original_sets ?? exercise.sets);
    const reps = Number(exercise.original_reps ?? exercise.reps);
    if (!Number.isInteger(sets) || sets <= 0 || !Number.isFinite(reps) || reps <= 0) return exercise;
    const total = Math.round(sets * reps * factor);
    const repsBySet = Array.from({ length: sets }, (_, index) =>
        Math.floor(total / sets) + (index < total % sets ? 1 : 0));
    return { ...exercise, sets, reps: repsBySet[0], reps_by_set: repsBySet };
}
