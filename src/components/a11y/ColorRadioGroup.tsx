import { useId } from 'react';
import { useTranslation } from 'react-i18next';

const COLOR_LABEL_KEYS: Record<string, string> = {
  '#ff00aa': 'appearance.colors.pink',
  '#00aaff': 'appearance.colors.blue',
  '#a100ff': 'appearance.colors.purple',
  '#ff5f00': 'appearance.colors.orange',
  '#00d47e': 'appearance.colors.green',
  '#ffb800': 'appearance.colors.yellow',
};

interface ColorRadioGroupProps {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

export default function ColorRadioGroup({ label, colors, value, onChange }: ColorRadioGroupProps) {
  const { t } = useTranslation();
  const id = useId();
  const labelId = `${id}-label`;

  return (
    <div className="customizer-group" role="group" aria-labelledby={labelId}>
      <span id={labelId}>{label}</span>
      <div id="colorPicker" className="color-picker" role="radiogroup" aria-label={label}>
        {colors.map((color) => {
          const colorLabel = t(COLOR_LABEL_KEYS[color.toLowerCase()] ?? color);
          const isSelected = value.toLowerCase() === color.toLowerCase();

          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={colorLabel}
              className={`color-pill ${isSelected ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          );
        })}
      </div>
    </div>
  );
}
