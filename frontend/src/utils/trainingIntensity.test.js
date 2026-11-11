import { adjustExercise, intensityFactor } from './trainingIntensity';

const original = { sets: 3, reps: 8, rest_seconds: 120 };
test.each([[80, 25], [60, 24], [40, 22], [20, 18]])('score %s adjusts total reps to %s', (score, total) => {
    const result = adjustExercise(original, intensityFactor(score));
    expect(result.reps_by_set.reduce((sum, reps) => sum + reps, 0)).toBe(total);
    expect(result.sets).toBe(3);
    expect(result.rest_seconds).toBe(120);
    expect(Math.max(...result.reps_by_set) - Math.min(...result.reps_by_set)).toBeLessThanOrEqual(1);
});
test('low readiness skips and absent scores preserve the original plan', () => {
    expect(intensityFactor(19)).toBe(0);
    expect(intensityFactor(0)).toBe(0);
    expect(adjustExercise(original, intensityFactor(null))).toBe(original);
});
test('always scales from original prescription when supplied', () => {
    expect(adjustExercise({ sets: 3, reps: 9, original_sets: 3, original_reps: 8 }, 1.05).reps_by_set).toEqual([9, 8, 8]);
    expect(original).toEqual({ sets: 3, reps: 8, rest_seconds: 120 });
});
