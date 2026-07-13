import { useEffect, useMemo } from 'react';
import { useStore } from '../hooks/StoreContext';
import { useExactUser } from '../hooks/useExactUser';
import { useAchievementCardVisible } from '../hooks/useAchievementCardVisible';
import { accentColors, seasonEmojis } from '../constants';
import { getAvailableThemes } from '../utils/marathonTheme';
import ColorRadioGroup from './a11y/ColorRadioGroup';
import FadeSection from './FadeSection';
import type { DataProps } from '../types';

export default function AppearanceControls({ allStats, allUsers }: DataProps) {
  const { currentBg, setCurrentBg, currentAccentColor, setCurrentAccentColor } = useStore();
  const { searchQuery, exactUsername } = useExactUser(allUsers);
  const isCardVisible = useAchievementCardVisible(allStats, allUsers);

  const availableThemes = useMemo(
    () => getAvailableThemes(allStats, exactUsername || searchQuery),
    [allStats, exactUsername, searchQuery],
  );

  useEffect(() => {
    if (availableThemes.length === 0) return;
    if (availableThemes.some((theme) => theme.gif === currentBg)) return;
    setCurrentBg(availableThemes[availableThemes.length - 1].gif);
  }, [availableThemes, currentBg, setCurrentBg]);

  return (
    <FadeSection
      show={isCardVisible}
      as="section"
      className="appearance-controls"
      aria-label="Card appearance"
    >
      <ColorRadioGroup
        label="Accent Color"
        colors={accentColors}
        value={currentAccentColor}
        onChange={setCurrentAccentColor}
      />

      <div className="customizer-group" role="group" aria-label="Background theme">
        <span>Background Theme</span>
        <div id="bgButtons" className="bg-buttons" role="radiogroup" aria-label="Background theme">
          {availableThemes.map((theme) => {
            const season = theme.name.split(' ')[0];
            const emoji = seasonEmojis[season] || '';
            const isSelected = theme.gif === currentBg;

            return (
              <button
                key={theme.gif}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`bg-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setCurrentBg(theme.gif)}
              >
                {emoji} {theme.name}
              </button>
            );
          })}
        </div>
      </div>
    </FadeSection>
  );
}
