import { useId } from 'react';

const COLOR_LABELS: Record<string, string> = {
  '#ff00aa': 'Pink',
  '#00aaff': 'Blue',
  '#a100ff': 'Purple',
  '#ff5f00': 'Orange',
  '#00d47e': 'Green',
  '#ffb800': 'Yellow',
};

interface ColorRadioGroupProps {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

export default function ColorRadioGroup({ label, colors, value, onChange }: ColorRadioGroupProps) {
  const id = useId();
  const labelId = `${id}-label`;

  return (
    <div className="customizer-group" role="group" aria-labelledby={labelId}>
      <span id={labelId}>{label}</span>
      <div id="colorPicker" className="color-picker" role="radiogroup" aria-label={label}>
        {colors.map((color) => {
          const colorLabel = COLOR_LABELS[color.toLowerCase()] ?? color;
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
