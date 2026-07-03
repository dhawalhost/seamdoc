/** Application toolbar: file actions, theme switching, settings, export. */

import { useRef, useState } from 'react';
import {
  Download,
  FilePlus,
  FolderOpen,
  LayoutTemplate,
  Moon,
  Palette,
  Settings,
  Share,
  Sun,
  X,
} from 'lucide-react';
import { builtinThemes, getBuiltinTheme, validateTheme } from '@seamdoc/themes';
import { importTemplate as importDocxTemplate, TemplateImportError } from '@seamdoc/templates';
import type { ExportFormat } from '@seamdoc/types';
import { resolveActiveTheme, useAppStore } from '../store';
import { downloadDocument, downloadThemeJson } from '../lib/export';

export function Toolbar() {
  const {
    markdown,
    themeId,
    settings,
    metadata,
    customThemes,
    template,
    darkMode,
    setThemeId,
    addCustomTheme,
    setTemplate,
    toggleDarkMode,
    setSettingsOpen,
    settingsOpen,
    newDocument,
    setMarkdown,
  } = useAppStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const themeInput = useRef<HTMLInputElement>(null);
  const templateInput = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [themeError, setThemeError] = useState('');
  const [templateError, setTemplateError] = useState('');

  const openFile = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    setMarkdown(await file.text());
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      await downloadDocument(
        format,
        markdown,
        resolveActiveTheme(themeId, customThemes),
        settings,
        metadata,
        template,
      );
    } finally {
      setExporting(null);
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

  const importTemplateFile = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    setTemplateError('');
    try {
      setTemplate(await importDocxTemplate(await file.arrayBuffer()));
    } catch (error) {
      setTemplateError(
        error instanceof TemplateImportError
          ? `Template import failed: ${error.message}`
          : 'Template import failed: unexpected error.',
      );
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
        onClick={() => templateInput.current?.click()}
        title="Import Word template (.docx)"
        aria-label="Import Word template"
        className="rounded p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <LayoutTemplate size={18} />
      </button>
      <input
        ref={templateInput}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        data-testid="template-file-input"
        onChange={(event) => {
          void importTemplateFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {template !== null && (
        <span
          data-testid="active-template"
          className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {template.metadata.name}
          <button
            type="button"
            onClick={() => setTemplate(null)}
            title="Remove template"
            aria-label="Remove template"
            data-testid="remove-template"
            className="rounded-full p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X size={12} />
          </button>
        </span>
      )}

      {templateError !== '' && (
        <span role="alert" data-testid="template-error" className="text-xs text-red-600">
          {templateError}
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
        onClick={() => void handleExport('pdf')}
        disabled={exporting !== null}
        data-testid="export-pdf-button"
        className="flex items-center gap-2 rounded border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-neutral-800"
      >
        <Download size={16} />
        {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
      </button>

      <button
        type="button"
        onClick={() => void handleExport('docx')}
        disabled={exporting !== null}
        data-testid="export-button"
        className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Download size={16} />
        {exporting === 'docx' ? 'Exporting…' : 'Export DOCX'}
      </button>
    </header>
  );
}
