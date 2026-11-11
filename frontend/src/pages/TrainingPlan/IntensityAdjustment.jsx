export default function IntensityAdjustment({ score, loading, error }) {
    if (loading) return <p role="status">Loading intensity adjustment…</p>;
    if (error) return <p role="alert">Unable to load your training score.</p>;
    if (score === null || score === undefined || score === '' || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) {
        return <p>No training score available. Add a daily entry to see your adjustment.</p>;
    }
    const value = Number(score);
    const target = value >= 80 ? '105%' : value >= 60 ? '100%' : value >= 40 ? '90%' : value >= 20 ? '75%' : 'Skip planned workout';
    return <div aria-label="Intensity adjustment">
        <p><strong>{target}</strong></p>
    </div>;
}
