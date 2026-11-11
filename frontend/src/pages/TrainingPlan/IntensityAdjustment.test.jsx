import { render, screen } from '@testing-library/react';
import IntensityAdjustment from './IntensityAdjustment';

 test.each([[100, '105%'], [80, '105%'], [79, '100%'], [60, '100%'], [59, '90%'], [40, '90%'], [39, '75%'], [20, '75%'], [19, 'Skip planned workout'], [0, 'Skip planned workout']])('score %s displays target %s', (score, target) => {
    render(<IntensityAdjustment score={score} />);
    expect(screen.getByText(target)).toBeInTheDocument();
    expect(screen.queryByText(/Final training score:/)).not.toBeInTheDocument();
});
