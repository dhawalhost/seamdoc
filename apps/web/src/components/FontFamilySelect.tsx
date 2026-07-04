/** Searchable font family picker backed by the shared catalog. */

import { FONT_CATALOG, fontCategoryLabel, type FontCategory } from '../lib/fontCatalog';

const CATEGORIES: readonly FontCategory[] = ['sans', 'serif', 'mono', 'display'];

interface FontFamilySelectProps {
  id: string;
  value: string;
  onChange: (family: string) => void;
  /** Empty option label; when set, allows clearing to theme default. */
  emptyLabel?: string;
  className?: string;
  'data-testid'?: string;
}

export function FontFamilySelect({
  id,
  value,
  onChange,
  emptyLabel,
  className = '',
  'data-testid': testId,
}: FontFamilySelectProps) {
  const known = FONT_CATALOG.some((font) => font.family === value);
  const showCustom = value !== '' && !known;

  return (
    <div className="flex flex-col gap-1">
      <select
        id={id}
        data-testid={testId}
        className={className}
        value={showCustom ? '__custom__' : value}
        onChange={(event) => {
          const next = event.target.value;
          if (next === '__custom__') {
            onChange(value === '' || known ? 'Custom Font' : value);
            return;
          }
          onChange(next);
        }}
        title="Pick a font from the catalog, or choose Custom to type any family name"
      >
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {CATEGORIES.map((category) => (
          <optgroup key={category} label={fontCategoryLabel(category)}>
            {FONT_CATALOG.filter((font) => font.category === category).map((font) => (
              <option key={font.family} value={font.family}>
                {font.family}
                {font.web ? ' (web)' : ''}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="__custom__">Custom…</option>
      </select>
      {showCustom && (
        <input
          type="text"
          aria-label={`${id} custom font family`}
          data-testid={testId === undefined ? undefined : `${testId}-custom`}
          className={className}
          value={value}
          placeholder="Any font family name"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
