/** Application-level preferences (Module 16 — Application Settings). */

import { X } from 'lucide-react';
import type { ExportFormat } from '@seamdoc/types';
import { builtinThemes } from '@seamdoc/themes';
import { useAppStore } from '../store';
import { TooltipButton } from './TooltipButton';

const fieldClass =
  'w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white';
const labelClass = 'block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1';

export function AppSettingsPanel() {
  const {
    darkMode,
    highContrast,
    defaultThemeId,
    defaultExportFormat,
    customThemes,
    toggleDarkMode,
    toggleHighContrast,
    setDefaultThemeId,
    setDefaultExportFormat,
    setAppSettingsOpen,
  } = useAppStore();

  return (
    <aside
      data-testid="app-settings-panel"
      className="flex w-72 flex-col gap-4 overflow-y-auto border-l border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      aria-labelledby="app-settings-heading"
    >
      <div className="flex items-center justify-between">
        <h2
          id="app-settings-heading"
          className="text-sm font-semibold text-neutral-900 dark:text-white"
        >
          App preferences
        </h2>
        <TooltipButton
          tooltip="Close app preferences"
          aria-label="Close app preferences"
          onClick={() => setAppSettingsOpen(false)}
          placement="top"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={16} />
        </TooltipButton>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          data-testid="pref-dark-mode"
          checked={darkMode}
          onChange={toggleDarkMode}
        />
        Dark mode
      </label>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          data-testid="pref-high-contrast"
          checked={highContrast}
          onChange={toggleHighContrast}
        />
        High contrast
      </label>

      <div>
        <label className={labelClass} htmlFor="default-theme">
          Default theme for new documents
        </label>
        <select
          id="default-theme"
          data-testid="default-theme"
          className={fieldClass}
          value={defaultThemeId}
          onChange={(event) => setDefaultThemeId(event.target.value)}
        >
          {builtinThemes.map((theme) => (
            <option key={theme.metadata.id} value={theme.metadata.id}>
              {theme.metadata.name}
            </option>
          ))}
          {customThemes.map((theme) => (
            <option key={theme.metadata.id} value={theme.metadata.id}>
              {theme.metadata.name} (imported)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="default-export-format">
          Default export format
        </label>
        <select
          id="default-export-format"
          data-testid="default-export-format"
          className={fieldClass}
          value={defaultExportFormat}
          onChange={(event) => setDefaultExportFormat(event.target.value as ExportFormat)}
        >
          <option value="docx">DOCX</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Preferences are saved locally. New documents use the default theme.
      </p>
    </aside>
  );
}
