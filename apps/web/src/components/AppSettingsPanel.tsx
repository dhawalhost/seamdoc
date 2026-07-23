/** Application-level preferences (Module 16 — Application Settings). */

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ExportFormat } from '@seamdoc/types';
import { FEATURE_FLAGS } from '../lib/features';
import { builtinThemes } from '@seamdoc/themes';
import { useAppStore } from '../store';
import { TooltipButton } from './TooltipButton';

const fieldClass =
  'w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white';
const labelClass = 'block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1';

export function AppSettingsPanel() {
  const { t } = useTranslation();
  const {
    darkMode,
    highContrast,
    defaultThemeId,
    defaultExportFormat,
    customThemes,
    geminiApiKey,
    toggleDarkMode,
    toggleHighContrast,
    setDefaultThemeId,
    setDefaultExportFormat,
    setGeminiApiKey,
    setAppSettingsOpen,
    enabledPluginIds,
    togglePluginId,
    clearAllRevisionsFromStore,
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
          {t('appPreferences')}
        </h2>
        <TooltipButton
          tooltip={t('closeAppPreferences')}
          aria-label={t('closeAppPreferences')}
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
        {t('darkMode')}
      </label>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          data-testid="pref-high-contrast"
          checked={highContrast}
          onChange={toggleHighContrast}
        />
        {t('highContrast')}
      </label>

      <div>
        <label className={labelClass} htmlFor="default-theme">
          {t('defaultThemeLabel')}
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
              {theme.metadata.name} {t('themeImported')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="default-export-format">
          {t('defaultExportFormat')}
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

      <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Community Plugins
        </h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              data-testid="plugin-toggle-latex"
              checked={enabledPluginIds.includes('latex')}
              onChange={() => togglePluginId('latex')}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-xs leading-none">LaTeX Math</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                Renders math formulas as KaTeX SVGs ($...$ and $$...$$)
              </div>
            </div>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              data-testid="plugin-toggle-mermaid"
              checked={enabledPluginIds.includes('mermaid')}
              onChange={() => togglePluginId('mermaid')}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-xs leading-none">Mermaid Diagrams</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                Renders fenced code blocks with language "mermaid" as diagrams
              </div>
            </div>
          </label>
        </div>
      </div>

      {FEATURE_FLAGS.enableAi && (
        <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <label className={labelClass} htmlFor="gemini-api-key">
            {t('geminiApiKeyLabel')}
          </label>
          <input
            id="gemini-api-key"
            type="password"
            data-testid="pref-gemini-api-key"
            className={fieldClass}
            value={geminiApiKey}
            onChange={(event) => setGeminiApiKey(event.target.value)}
            placeholder={t('geminiApiKeyPlaceholder')}
          />
        </div>
      )}

      <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Database & Storage
        </h3>
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear all local revisions history? This action is permanent.')) {
              void clearAllRevisionsFromStore();
            }
          }}
          className="w-full rounded border border-red-200 bg-red-50/50 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100/50 dark:border-red-900/30 dark:bg-red-950/10 dark:hover:bg-red-950/20 cursor-pointer"
        >
          Clear History Cache
        </button>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('preferencesFootnote')}</p>
    </aside>
  );
}
