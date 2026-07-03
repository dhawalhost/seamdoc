/** Application toolbar: file actions, theme switching, settings, export. */

import { useRef, useState } from 'react';
import { Download, FilePlus, FolderOpen, Moon, Palette, Settings, Share, Sun } from 'lucide-react';
import { builtinThemes, getBuiltinTheme, validateTheme } from '@seamdoc/themes';
import { resolveActiveTheme, useAppStore } from '../store';
import { downloadDocx, downloadThemeJson } from '../lib/export';

export function Toolbar() {
  const {
    markdown,
    themeId,
    settings,
    metadata,
    customThemes,
    darkMode,
    setThemeId,
    addCustomTheme,
    toggleDarkMode,
    setSettingsOpen,
    settingsOpen,
    newDocument,
    setMarkdown,
  } = useAppStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const themeInput = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [themeError, setThemeError] = useState('');

  const openFile = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    setMarkdown(await file.text());
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadDocx(markdown, resolveActiveTheme(themeId, customThemes), settings, metadata);
    } finally {
      setExporting(false);
    }
  };

  const importTheme = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    setThemeError('');
    try {
      const result = validateTheme(JSON.parse(await file.text()));
      if (result.valid && result.theme !== null) {
        addCustomTheme(result.theme);
      } else {
        setThemeError(`Invalid theme: ${result.errors[0] ?? 'unknown error'}`);
      }
    } catch {
      setThemeError('Invalid theme: file is not valid JSON.');
    }
  };

  const exportTheme = () => {
    const active =
      customThemes.find((theme) => theme.metadata.id === themeId) ?? getBuiltinTheme(themeId);
    if (active !== undefined) {
      downloadThemeJson(active);
    }
  };

  const words = markdown.trim() === '' ? 0 : markdown.trim().split(/\s+/).length;

  return (
    <header className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900">
      <span className="mr-2 text-lg font-semibold text-neutral-900 dark:text-white">Seamdoc</span>

      <button
        type="button"
        onClick={newDocument}
        title="New document"
        aria-label="New document"
        className="rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <FilePlus size={18} />
      </button>

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        title="Open Markdown file"
        aria-label="Open Markdown file"
        className="rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <FolderOpen size={18} />
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="hidden"
        data-testid="file-input"
        onChange={(event) => {
          void openFile(event.target.files?.[0]);
          // Reset so selecting the same file again re-triggers onChange.
          event.target.value = '';
        }}
      />

      <div className="mx-2 h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

      <label
        htmlFor="theme-select"
        className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300"
      >
        Theme
        <select
          id="theme-select"
          value={themeId}
          onChange={(event) => setThemeId(event.target.value)}
          data-testid="theme-select"
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
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
      </label>

      <button
        type="button"
        onClick={() => themeInput.current?.click()}
        title="Import theme (JSON)"
        aria-label="Import theme"
        className="rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Palette size={18} />
      </button>
      <input
        ref={themeInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        data-testid="theme-file-input"
        onChange={(event) => {
          void importTheme(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={exportTheme}
        title="Export active theme (JSON)"
        aria-label="Export active theme"
        data-testid="theme-export-button"
        className="rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Share size={18} />
      </button>

      {themeError !== '' && (
        <span role="alert" data-testid="theme-error" className="text-xs text-red-600">
          {themeError}
        </span>
      )}

      <button
        type="button"
        onClick={() => setSettingsOpen(!settingsOpen)}
        title="Document settings"
        aria-label="Document settings"
        data-testid="settings-toggle"
        className="rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Settings size={18} />
      </button>

      <div className="flex-1" />

      <span
        className="mr-2 text-xs text-neutral-500 dark:text-neutral-400"
        data-testid="word-count"
      >
        {words} {words === 1 ? 'word' : 'words'}
      </span>

      <button
        type="button"
        onClick={toggleDarkMode}
        title="Toggle dark mode"
        aria-label="Toggle dark mode"
        data-testid="dark-mode-toggle"
        className="rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={exporting}
        data-testid="export-button"
        className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Download size={16} />
        {exporting ? 'Exporting…' : 'Export DOCX'}
      </button>
    </header>
  );
}
