import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import ToggleGroup from './ToggleGroup';
import ColorRadioGroup from './ColorRadioGroup';

describe('a11y primitives', () => {
  it('ToggleGroup exposes a radiogroup without axe violations', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleGroup
        label="Sort mode"
        value="chrono"
        options={[
          { value: 'chrono', label: 'Chronological' },
          { value: 'metric', label: 'By metric' },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Sort mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Chronological' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    fireEvent.click(screen.getByRole('radio', { name: 'By metric' }));
    expect(onChange).toHaveBeenCalledWith('metric');

    expect(await axe(container)).toHaveNoViolations();
  });

  it('ColorRadioGroup labels colors and passes axe', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorRadioGroup
        label="Accent color"
        colors={['#ff00aa', '#00aaff']}
        value="#ff00aa"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Pink' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(onChange).toHaveBeenCalledWith('#00aaff');

    expect(await axe(container)).toHaveNoViolations();
  });
});
