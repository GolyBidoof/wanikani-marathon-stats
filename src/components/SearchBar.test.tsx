import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import SearchBar from './SearchBar';
import { StoreProvider } from '../hooks/StoreContext';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves uppercase characters while typing', () => {
    render(
      <StoreProvider allUsers={['GolyBidoof']}>
        <SearchBar allUsers={['GolyBidoof']} />
      </StoreProvider>,
    );

    const input = screen.getByLabelText('WaniKani username');
    fireEvent.change(input, { target: { value: 'Goly' } });

    expect(input).toHaveValue('Goly');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(input).toHaveValue('Goly');
  });
});
