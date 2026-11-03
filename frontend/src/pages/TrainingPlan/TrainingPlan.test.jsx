import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TrainingPlan from './TrainingPlan';

jest.mock('../../component/MainNavBar/MainNav', () => () => <nav>Main navigation</nav>);

const exercise = {
    id: 'curl', name: 'Dumbbell curl', equipment: ['dumbbell'],
    gif_url: 'https://example.com/curl.gif', sets: 3, reps: 8, rest_seconds: 120,
};

beforeEach(() => {
    localStorage.setItem('access_token', 'test-token');
    global.fetch = jest.fn().mockImplementation(async url => ({
        ok: true,
        json: async () => url.endsWith('/dashboard/scores') ? [] :
            { recommendations: [exercise], equipment_available: ['dumbbells'] },
    }));
});
afterEach(() => { localStorage.clear(); jest.restoreAllMocks(); });

test('loads authenticated recommendations, renders GIF, and refetches with filters', async () => {
    render(<TrainingPlan />);
    expect(screen.getByText('Loading your training plan…')).toBeInTheDocument();
    expect(await screen.findByText('Dumbbell curl')).toBeInTheDocument();
    expect(screen.getByAltText('Dumbbell curl demonstration')).toHaveAttribute('src', exercise.gif_url);
    expect(screen.getByText('120 sec')).toBeInTheDocument();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    fireEvent.change(screen.getByLabelText('Focus area'), { target: { value: 'upper_body' } });
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('focus=upper_body'))).toBe(true));
    await screen.findByText('Dumbbell curl');
});

test('displays backend failures and lets the user retry', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({ detail: 'Exercise catalog unavailable.' }) });
    render(<TrainingPlan />);
    expect(await screen.findByText('Exercise catalog unavailable.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh recommendations' }));
    expect(await screen.findByText('Dumbbell curl')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('shows empty results after filters remove all recommendations', async () => {
    render(<TrainingPlan />);
    await screen.findByText('Dumbbell curl');
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ recommendations: [], equipment_available: [], message: 'Choose equipment.' }) });
    fireEvent.change(screen.getByLabelText('Training goal'), { target: { value: 'endurance' } });
    expect(await screen.findByText('Choose equipment.')).toBeInTheDocument();
    expect(screen.queryByText('Dumbbell curl')).not.toBeInTheDocument();
});

test('replaces the displayed exercises and prescription when goal and focus change', async () => {
    render(<TrainingPlan />);
    await screen.findByText('Dumbbell curl');
    const squat = { ...exercise, id: 'squat', name: 'Bodyweight squat', target_muscle: ['quads'], reps: 15, rest_seconds: 45 };
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ recommendations: [squat], equipment_available: ['bodyweight'] }) });
    fireEvent.change(screen.getByLabelText('Focus area'), { target: { value: 'lower_body' } });
    expect(await screen.findByText('Bodyweight squat')).toBeInTheDocument();
    expect(screen.getByText('quads')).toBeInTheDocument();
    expect(screen.queryByText('Dumbbell curl')).not.toBeInTheDocument();
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ recommendations: [{ ...squat, sets: 2, reps: 10, rest_seconds: 60 }], equipment_available: ['bodyweight'] }) });
    fireEvent.change(screen.getByLabelText('Training goal'), { target: { value: 'healthy_lifestyle' } });
    await waitFor(() => expect(screen.getByText('2 × 10')).toBeInTheDocument());
    const lastUrl = fetch.mock.calls[fetch.mock.calls.length - 1][0];
    expect(lastUrl).toContain('goal=healthy_lifestyle');
    expect(lastUrl).toContain('focus=lower_body');
});


test('displays the score and adjusted reps from the recommendation response', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({
        final_training_score: 85, workout_adjustment: 1.05,
        recommendations: [{ ...exercise, reps: 9, reps_by_set: [9, 8, 8] }],
        equipment_available: ['dumbbells'],
    }) });
    render(<TrainingPlan />);
    expect(await screen.findByText('Increase by 5%')).toBeInTheDocument();
    expect(screen.getByText('105% of original plan')).toBeInTheDocument();
    expect(screen.getByText('3 sets: 9 / 8 / 8 reps')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
});


test('Done adds a recommendation to the daily workout and survives refresh', async () => {
    localStorage.setItem('user_id', 'workout-user');
    render(<TrainingPlan />);
    await screen.findByText('Dumbbell curl');
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Dumbbell curl' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done', exact: true }));
    expect(screen.getByText(/added to Today’s Workout/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Daily Entry' })).toHaveAttribute('href', '/entry');
    expect(screen.queryByRole('button', { name: 'Actions for Dumbbell curl' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh recommendations' }));
    await screen.findByText('No exercises available for this plan.');
    expect(screen.queryByRole('button', { name: 'Actions for Dumbbell curl' })).not.toBeInTheDocument();
});
