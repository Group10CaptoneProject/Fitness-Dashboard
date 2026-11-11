export default function IntensityAdjustment({ score, loading, error }) {
    if (loading) return <p role="status">Loading readiness…</p>;
    if (error) return <p role="alert">Unable to load today’s training score.</p>;
    if (score === null || score === undefined || score === '' || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) {
        return <p>No training score for today. Add a daily entry to see your adjustment.</p>;
    }
    const value = Number(score);
    const [readiness, adjustment, target] = value >= 80
        ? ['High readiness', 'Increase by 5%', '105% of original plan']
        : value >= 60
        ? ['Good readiness', 'Maintain planned workout', '100% of original plan']
        : value >= 40
        ? ['Reduced readiness', 'Decrease by 10%', '90% of original plan']
        : value >= 20
        ? ['Low readiness', 'Decrease by 25%', '75% of original plan']
        : ['Very low readiness', 'Rest or gentle activity', 'Skip planned workout'];
    return <div aria-label="Today’s intensity adjustment">
        <p>Final training score: <strong>{value}/100</strong></p>
        <p>{readiness}</p>
        <p><strong>{adjustment}</strong></p>
        <p>{target}</p>
    </div>;
}