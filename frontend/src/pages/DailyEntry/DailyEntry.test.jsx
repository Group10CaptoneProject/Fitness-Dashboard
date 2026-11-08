import { render, screen } from '@testing-library/react';
import DailyEntry from './DailyEntry';
import { completeWorkout, completedWorkouts, mergeCompletedWorkouts, workoutDate } from '../../utils/completedWorkouts';

jest.mock('react-router', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../component/MainNavBar/MainNav', () => () => <nav>Main navigation</nav>);

const exercise = { id: 'curl', name: 'Dumbbell curl', target_muscle: ['biceps'], sets: 3, reps: 9, reps_by_set: [9, 8, 8] };
beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('user_id', 'workout-user');
    localStorage.setItem('access_token', 'test-token');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
});
afterEach(() => { localStorage.clear(); jest.restoreAllMocks(); });

test('completed recommendation appears in Today’s Workout after entry loading finishes', async () => {
    completeWorkout(exercise);
    render(<DailyEntry />);
    expect(await screen.findByDisplayValue('Dumbbell curl')).toBeInTheDocument();
    expect(await screen.findByText('Completed recommendation: 3 sets: 9 / 8 / 8 reps')).toBeInTheDocument();
    expect(screen.getByText('Today’s Workout')).toBeInTheDocument();
});

test('deduplicates completion and isolates account and date', () => {
    completeWorkout(exercise);
    completeWorkout(exercise);
    expect(completedWorkouts()).toHaveLength(1);
    expect(completedWorkouts('2000-01-01')).toEqual([]);
    localStorage.setItem('user_id', 'another-user');
    expect(completedWorkouts()).toEqual([]);
});

test('merges into saved workout without losing user-entered values', () => {
    completeWorkout(exercise);
    const merged = mergeCompletedWorkouts([{ id: 'existing', exercise: 'Dumbbell curl', duration: '25', difficulty: 7 }], workoutDate());
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ duration: '25', difficulty: 7, reps_by_set: [9, 8, 8] });
});


test.each([
    ['biceps', 'upper_Body', 'Biceps'], ['upper back', 'upper_Body', 'Back'],
    ['pectorals', 'upper_Body', 'Chest'], ['forearms', 'upper_Body', 'Forearms'],
    ['levator scapulae', 'upper_Body', 'Neck'], ['quads', 'lower_Body', 'Quads'],
    ['cardiovascular system', 'cardio', 'Cardio'], ['abs', 'cardio', 'Abs'],
])('completed %s fills both muscle fields', async (target, group, area) => {
    completeWorkout({ ...exercise, target_muscle: [target] });
    render(<DailyEntry />);
    expect(await screen.findByDisplayValue('Dumbbell curl')).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    expect(selects.some(select => select.value === group)).toBe(true);
    expect(selects.some(select => select.value === area)).toBe(true);
});

test('fills missing muscle fields on an existing exercise without changing other inputs', () => {
    completeWorkout(exercise);
    const [merged] = mergeCompletedWorkouts([{ exercise: exercise.name, duration: '25', muscleGroup: '', muscleArea: '' }], workoutDate());
    expect(merged).toMatchObject({ duration: '25', muscleGroup: 'upper_Body', muscleArea: 'Biceps' });
});
