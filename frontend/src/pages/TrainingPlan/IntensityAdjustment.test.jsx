import { render, screen } from '@testing-library/react';
import IntensityAdjustment from './IntensityAdjustment';

test.each([
    [100, 'High readiness', 'Increase by 5%', '105% of original plan'],
    [80, 'High readiness', 'Increase by 5%', '105% of original plan'],
    [79, 'Good readiness', 'Maintain planned workout', '100% of original plan'],
    [60, 'Good readiness', 'Maintain planned workout', '100% of original plan'],
    [59, 'Reduced readiness', 'Decrease by 10%', '90% of original plan'],
    [40, 'Reduced readiness', 'Decrease by 10%', '90% of original plan'],
    [39, 'Low readiness', 'Decrease by 25%', '75% of original plan'],
    [20, 'Low readiness', 'Decrease by 25%', '75% of original plan'],
    [19, 'Very low readiness', 'Rest or gentle activity', 'Skip planned workout'],
    [0, 'Very low readiness', 'Rest or gentle activity', 'Skip planned workout'],
])('score %s shows the matching table row', (score, readiness, adjustment, target) => {
    render(<IntensityAdjustment score={score} />);
    expect(screen.getByText(readiness)).toBeInTheDocument();
    expect(screen.getByText(adjustment)).toBeInTheDocument();
    expect(screen.getByText(target)).toBeInTheDocument();
});

test.each([null, undefined, '', 'invalid', -1, 101])('missing or invalid score %s does not imply rest', score => {
    render(<IntensityAdjustment score={score} />);
    expect(screen.getByText(/No training score for today/)).toBeInTheDocument();
    expect(screen.queryByText('Skip planned workout')).not.toBeInTheDocument();
});
