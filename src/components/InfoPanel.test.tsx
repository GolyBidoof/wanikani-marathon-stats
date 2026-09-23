import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import InfoPanel from './InfoPanel';
import i18n from '../i18n';
import { SITE } from '../constants';

describe('InfoPanel', () => {
  it('keeps the organization thread as a low-key link behind the panel toggle', () => {
    render(<InfoPanel />);

    const label = i18n.t('info.organizationLink');
    expect(screen.queryByRole('link', { name: label })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: i18n.t('info.show') }));

    const link = screen.getByRole('link', { name: label });
    expect(link).toHaveAttribute('href', SITE.organizationUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has no axe violations once the panel is open', async () => {
    const { container } = render(<InfoPanel />);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('info.show') }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('still credits soggyboy alongside the organization crew', () => {
    const credits = i18n.t('header.footerCredits');
    expect(credits).toContain('Midnightblue');
    expect(credits).toContain('organization crew');
    expect(credits).toContain('soggyboy');
  });

  it('breaks the footer credit line before the data credit', () => {
    // Rendered with `white-space: pre-line`, so the break has to be in the copy.
    expect(i18n.t('header.footerCredits')).toMatch(/\nData curated by GolyBidoof\./);
    expect(i18n.getResource('en', 'translation', 'header.footerCredits')).toContain('\n');
    void i18n.changeLanguage('ja');
    expect(i18n.t('header.footerCredits')).toMatch(/\nデータ整備：GolyBidoof。/);
    void i18n.changeLanguage('en');
  });

  it('names the organization crew in the info copy', () => {
    expect(i18n.t('info.description')).toContain('organization crew');
  });
});
