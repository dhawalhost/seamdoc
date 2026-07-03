/**
 * Application state (Zustand). Global state holds application-level data
 * only; editor internals stay local to components. Document content and
 * preferences persist to localStorage so work survives reloads (auto save)
 * while never leaving the device (privacy doctrine).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocumentMetadata, DocumentSettings, ExportFormat } from '@seamdoc/types';
import { DEFAULT_DOCUMENT_METADATA, DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import { getBuiltinTheme, type Theme } from '@seamdoc/themes';
import type { StyleMapping, TemplateProfile } from '@seamdoc/templates';
import type { PreviewZoom } from './lib/previewZoom';

export const SAMPLE_MARKDOWN = `# Welcome to Seamdoc

Write **Markdown** on the left and see a themed preview on the right.

## Getting started

1. Write or paste Markdown, or drop a \`.md\` file anywhere.
2. Pick a theme from the toolbar.
3. Adjust document settings if needed.
4. Click **Export DOCX** to download a Word document.

> Everything runs in your browser. Your document never leaves your device.

\`\`\`typescript
const seamdoc = 'Markdown in, Word out';
\`\`\`

| Feature | Status |
| :------ | -----: |
| Editor  | Ready  |
| Preview | Ready  |
| Export  | Ready  |
`;

interface AppState {
  markdown: string;
  themeId: string;
  settings: DocumentSettings;
  metadata: DocumentMetadata;
  /** Imported (community) themes, persisted locally. */
  customThemes: Theme[];
  /** Active DOCX template profile; null when no template is applied. */
  template: TemplateProfile | null;
  /** Settings values overridden by the template, for restore on removal. */
  settingsBeforeTemplate: Partial<DocumentSettings> | null;
  darkMode: boolean;
  highContrast: boolean;
  settingsOpen: boolean;
  appSettingsOpen: boolean;
  previewZoom: PreviewZoom;
  printPreview: boolean;
  editorFullscreen: boolean;
  previewRefreshNonce: number;
  defaultThemeId: string;
  defaultExportFormat: ExportFormat;
  dragDropError: string;
  setMarkdown: (markdown: string) => void;
  setThemeId: (themeId: string) => void;
  addCustomTheme: (theme: Theme) => void;
  setTemplate: (template: TemplateProfile | null) => void;
  updateTemplateMapping: (mapping: StyleMapping) => void;
  updateSettings: (settings: Partial<DocumentSettings>) => void;
  updateMetadata: (metadata: Partial<DocumentMetadata>) => void;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  setSettingsOpen: (open: boolean) => void;
  setAppSettingsOpen: (open: boolean) => void;
  setPreviewZoom: (zoom: PreviewZoom) => void;
  togglePrintPreview: () => void;
  toggleEditorFullscreen: () => void;
  refreshPreview: () => void;
  setDefaultThemeId: (themeId: string) => void;
  setDefaultExportFormat: (format: ExportFormat) => void;
  setDragDropError: (message: string) => void;
  newDocument: () => void;
}

/** Resolves the active theme: custom themes first, then built-ins by id. */
export function resolveActiveTheme(
  themeId: string,
  customThemes: readonly Theme[],
): Theme | string {
  return customThemes.find((theme) => theme.metadata.id === themeId) ?? themeId;
}

export function isBuiltinThemeId(themeId: string): boolean {
  return getBuiltinTheme(themeId) !== undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      markdown: SAMPLE_MARKDOWN,
      themeId: 'minimal',
      settings: DEFAULT_DOCUMENT_SETTINGS,
      metadata: DEFAULT_DOCUMENT_METADATA,
      customThemes: [],
      template: null,
      settingsBeforeTemplate: null,
      darkMode: false,
      highContrast: false,
      settingsOpen: false,
      appSettingsOpen: false,
      previewZoom: 1,
      printPreview: false,
      editorFullscreen: false,
      previewRefreshNonce: 0,
      defaultThemeId: 'minimal',
      defaultExportFormat: 'docx',
      dragDropError: '',
      setMarkdown: (markdown) => set({ markdown }),
      setThemeId: (themeId) => set({ themeId }),
      addCustomTheme: (theme) =>
        set((state) => ({
          customThemes: [
            ...state.customThemes.filter((t) => t.metadata.id !== theme.metadata.id),
            theme,
          ],
          themeId: theme.metadata.id,
        })),
      setTemplate: (template) =>
        set((state) => {
          if (template === null) {
            // Restore the page setup the template had overridden.
            return {
              template: null,
              settingsBeforeTemplate: null,
              settings: { ...state.settings, ...state.settingsBeforeTemplate },
            };
          }
          // Templates preserve the source document's page setup
          // (docs/02-architecture/template-engine.md, preserved elements).
          const overridden: Partial<DocumentSettings> = {};
          for (const key of Object.keys(template.pageSettings) as (keyof DocumentSettings)[]) {
            Object.assign(overridden, { [key]: state.settings[key] });
          }
          return {
            template,
            settingsBeforeTemplate:
              state.settingsBeforeTemplate === null ? overridden : state.settingsBeforeTemplate,
            settings: { ...state.settings, ...template.pageSettings },
          };
        }),
      updateTemplateMapping: (mapping) =>
        set((state) =>
          state.template === null
            ? {}
            : {
                template: { ...state.template, mapping: { ...state.template.mapping, ...mapping } },
              },
        ),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      updateMetadata: (partial) =>
        set((state) => ({ metadata: { ...state.metadata, ...partial } })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setAppSettingsOpen: (appSettingsOpen) => set({ appSettingsOpen }),
      setPreviewZoom: (previewZoom) => set({ previewZoom }),
      togglePrintPreview: () =>
        set((state) => ({
          printPreview: !state.printPreview,
          editorFullscreen: state.printPreview ? state.editorFullscreen : false,
        })),
      toggleEditorFullscreen: () =>
        set((state) => ({
          editorFullscreen: !state.editorFullscreen,
          printPreview: state.editorFullscreen ? state.printPreview : false,
        })),
      refreshPreview: () =>
        set((state) => ({ previewRefreshNonce: state.previewRefreshNonce + 1 })),
      setDefaultThemeId: (defaultThemeId) => set({ defaultThemeId }),
      setDefaultExportFormat: (defaultExportFormat) => set({ defaultExportFormat }),
      setDragDropError: (dragDropError) => set({ dragDropError }),
      newDocument: () =>
        set((state) => ({
          markdown: '',
          themeId: state.defaultThemeId,
          metadata: DEFAULT_DOCUMENT_METADATA,
        })),
    }),
    {
      name: 'seamdoc',
      partialize: (state) => ({
        markdown: state.markdown,
        themeId: state.themeId,
        settings: state.settings,
        metadata: state.metadata,
        customThemes: state.customThemes,
        template: state.template,
        settingsBeforeTemplate: state.settingsBeforeTemplate,
        darkMode: state.darkMode,
        highContrast: state.highContrast,
        previewZoom: state.previewZoom,
        defaultThemeId: state.defaultThemeId,
        defaultExportFormat: state.defaultExportFormat,
      }),
    },
  ),
);
