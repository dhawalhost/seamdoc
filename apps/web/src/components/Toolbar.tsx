/** Application toolbar: file actions, theme switching, settings, export. */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  FilePlus,
  FolderOpen,
  LayoutTemplate,
  Moon,
  Palette,
  Settings,
  Share,
  SlidersHorizontal,
  Sun,
  WandSparkles,
  X,
} from 'lucide-react';
import { FEATURE_FLAGS } from '../lib/features';
import { builtinThemes, getBuiltinTheme, validateTheme } from '@seamdoc/themes';
import { importTemplate as importDocxTemplate, TemplateImportError } from '@seamdoc/templates';
import type { ExportFormat } from '@seamdoc/types';
import { resolveActiveTheme, useAppStore } from '../store';

import { downloadDocument, downloadThemeJson } from '../lib/export';
import { computeDocumentStats, formatDocumentStats } from '../lib/documentStats';
import { TooltipButton, toolbarIconClass } from './TooltipButton';
import { ThemeSelect } from './ThemeSelect';

export function Toolbar({ onOpenExportWizard }: { onOpenExportWizard?: () => void }) {
  const { t } = useTranslation();
  const {
    markdown,
    themeId,
    settings,
    metadata,
    customThemes,
    template,
    darkMode,
    defaultExportFormat,
    setThemeId,
    addCustomTheme,
    setTemplate,
    toggleDarkMode,
    setSettingsOpen,
    setAppSettingsOpen,
    openThemeCreator,
    settingsOpen,
    appSettingsOpen,
    criticOpen,
    setCriticOpen,
    newDocument,
    setMarkdown,
  } = useAppStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const themeInput = useRef<HTMLInputElement>(null);
  const templateInput = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [themeError, setThemeError] = useState('');
  const [templateError, setTemplateError] = useState('');
  const [exportError, setExportError] = useState('');

  const openFile = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    setMarkdown(await file.text());
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setExportError('');
    try {
      await downloadDocument(
        format,
        markdown,
        resolveActiveTheme(themeId, customThemes),
        settings,
        metadata,
        template,
      );
    } catch (error) {
      setExportError(
        `Export failed: ${error instanceof Error ? error.message : 'unexpected error'}`,
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

  const stats = formatDocumentStats(computeDocumentStats(markdown));
  const activeTheme = resolveActiveTheme(themeId, customThemes);
  const themeMetadata =
    typeof activeTheme === 'string' ? getBuiltinTheme(themeId)?.metadata : activeTheme.metadata;

  const exportButtonClass = (format: ExportFormat) => {
    const isDefault = format === defaultExportFormat;
    return isDefault
      ? 'flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
      : 'flex items-center gap-2 rounded border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-neutral-800';
  };

  return (
    <header
      className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900"
      data-no-print
      role="banner"
    >
      <span className="mr-2 text-lg font-semibold text-neutral-900 dark:text-white">Seamdoc</span>

      <TooltipButton
        tooltip={t('toolbarNewDoc')}
        aria-label={t('toolbarNewDocAriaLabel')}
        onClick={newDocument}
        className={toolbarIconClass}
      >
        <FilePlus size={18} />
      </TooltipButton>

      <TooltipButton
        tooltip={t('toolbarOpenFile')}
        aria-label={t('toolbarOpenFileAriaLabel')}
        onClick={() => fileInput.current?.click()}
        className={toolbarIconClass}
      >
        <FolderOpen size={18} />
      </TooltipButton>
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

      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <span>{t('themeLabel')}</span>
        <ThemeSelect />

        {/* Visually hidden select for backward-compatibility with E2E tests */}
        <select
          id="theme-select"
          value={themeId}
          onChange={(event) => setThemeId(event.target.value)}
          data-testid="theme-select"
          className="sr-only"
          aria-hidden="true"
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

        {themeMetadata !== undefined && (
          <span
            data-testid="theme-metadata"
            className="hidden text-xs text-neutral-400 lg:inline"
            title={themeMetadata.description}
          >
            v{themeMetadata.version}
          </span>
        )}
      </div>

      <TooltipButton
        tooltip={t('toolbarThemeCreator')}
        aria-label={t('toolbarThemeCreatorAriaLabel')}
        onClick={openThemeCreator}
        data-testid="theme-creator-toggle"
        className={toolbarIconClass}
      >
        <WandSparkles size={18} />
      </TooltipButton>

      <TooltipButton
        tooltip={t('toolbarImportTheme')}
        aria-label={t('toolbarImportThemeAriaLabel')}
        onClick={() => themeInput.current?.click()}
        className={toolbarIconClass}
      >
        <Palette size={18} />
      </TooltipButton>
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

      <TooltipButton
        tooltip={t('toolbarExportTheme')}
        aria-label={t('toolbarExportThemeAriaLabel')}
        onClick={exportTheme}
        data-testid="theme-export-button"
        className={toolbarIconClass}
      >
        <Share size={18} />
      </TooltipButton>

      {themeError !== '' && (
        <span role="alert" data-testid="theme-error" className="text-xs text-red-600">
          {themeError}
        </span>
      )}

      <TooltipButton
        tooltip={t('toolbarImportTemplate')}
        aria-label={t('toolbarImportTemplateAriaLabel')}
        onClick={() => templateInput.current?.click()}
        className={toolbarIconClass}
      >
        <LayoutTemplate size={18} />
      </TooltipButton>
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
          title="This Word template will be applied on the next DOCX export"
          className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {template.metadata.name}
          <TooltipButton
            tooltip={t('toolbarRemoveTemplate')}
            aria-label={t('toolbarRemoveTemplateAriaLabel')}
            onClick={() => setTemplate(null)}
            data-testid="remove-template"
            placement="top"
            className="rounded-full p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X size={12} />
          </TooltipButton>
        </span>
      )}

      {templateError !== '' && (
        <span role="alert" data-testid="template-error" className="text-xs text-red-600">
          {templateError}
        </span>
      )}

      <TooltipButton
        tooltip={t('toolbarDocSettings')}
        aria-label={t('toolbarDocSettingsAriaLabel')}
        onClick={() => setSettingsOpen(!settingsOpen)}
        data-testid="settings-toggle"
        className={toolbarIconClass}
      >
        <Settings size={18} />
      </TooltipButton>

      <TooltipButton
        tooltip={t('toolbarAppPrefs')}
        aria-label={t('toolbarAppPrefsAriaLabel')}
        onClick={() => setAppSettingsOpen(!appSettingsOpen)}
        data-testid="app-settings-toggle"
        className={toolbarIconClass}
      >
        <SlidersHorizontal size={18} />
      </TooltipButton>

      {FEATURE_FLAGS.enableAi && (
        <TooltipButton
          tooltip={t('toolbarAiCritic')}
          aria-label={t('toolbarAiCriticAriaLabel')}
          onClick={() => setCriticOpen(!criticOpen)}
          data-testid="critic-toggle"
          className={toolbarIconClass}
        >
          <WandSparkles size={18} />
        </TooltipButton>
      )}

      <div className="flex-1" />

      {exportError !== '' && (
        <span role="alert" data-testid="export-error" className="mr-2 text-xs text-red-600">
          {exportError}
        </span>
      )}

      <span
        className="mr-2 text-xs text-neutral-500 dark:text-neutral-400"
        data-testid="word-count"
        title="Word, line, and character counts for the current Markdown"
      >
        {stats}
      </span>

      <TooltipButton
        tooltip={darkMode ? t('toolbarDarkModeOn') : t('toolbarDarkModeOff')}
        aria-label={t('toolbarDarkModeAriaLabel')}
        onClick={toggleDarkMode}
        data-testid="dark-mode-toggle"
        className={toolbarIconClass}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </TooltipButton>

      <button
        type="button"
        onClick={() => void handleExport('pdf')}
        disabled={exporting !== null}
        data-testid="export-pdf-button"
        title="Download the current document as a PDF file"
        className={exportButtonClass('pdf')}
      >
        <Download size={16} />
        {exporting === 'pdf' ? t('exportingLabel') : t('exportPdf')}
      </button>

      <button
        type="button"
        onClick={onOpenExportWizard}
        disabled={exporting !== null}
        data-testid="export-wizard-button"
        title="Open the Export Wizard to choose format and settings"
        className="flex items-center gap-2 rounded border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-neutral-800"
      >
        <WandSparkles size={16} />
        {t('exportEllipsis')}
      </button>

      <button
        type="button"
        onClick={() => void handleExport('docx')}
        disabled={exporting !== null}
        data-testid="export-button"
        title="Download the current document as a Word (.docx) file"
        className={exportButtonClass('docx')}
      >
        <Download size={16} />
        {exporting === 'docx' ? t('exportingLabel') : t('exportDocx')}
      </button>
    </header>
  );
}
