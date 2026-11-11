import { intensityFactor } from '../../utils/trainingIntensity';

export default function IntensityAdjustment({ score, loading, error }) {
    if (loading) return <p role="status">Loading intensity adjustment…</p>;
    if (error) return <p role="alert">Unable to load your training score.</p>;
    const factor = intensityFactor(score);
    if (factor === null) {
        return <p>No training score available. Add a daily entry to see your adjustment.</p>;
    }
    const target = factor === 0 ? 'Skip planned workout' : `${Math.round(factor * 100)}%`;
    return <div aria-label="Intensity adjustment">
        <p><strong>{target}</strong></p>
    </div>;
}
