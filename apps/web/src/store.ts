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
import { createThemeDraft, getBuiltinTheme, withThemeDefaults, type Theme } from '@seamdoc/themes';
import { renderMarkdown, analyzeDocumentStructure, type CriticFinding } from '@seamdoc/core';
import type { StyleMapping, TemplateProfile } from '@seamdoc/templates';

import type { PreviewZoom } from './lib/previewZoom';
import {
  type Revision,
  getRevisions,
  saveRevision,
  deleteRevision as deleteDbRevision,
  clearAllRevisions as clearAllDbRevisions,
} from './lib/db';

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
  themeCreatorOpen: boolean;
  /** Working copy in the theme creator; null when the portal is closed. */
  themeDraft: Theme | null;
  previewZoom: PreviewZoom;
  printPreview: boolean;
  editorFullscreen: boolean;
  previewRefreshNonce: number;
  defaultThemeId: string;
  defaultExportFormat: ExportFormat;
  dragDropError: string;
  geminiApiKey: string;
  criticOpen: boolean;
  criticFindings: readonly CriticFinding[];
  criticLoading: boolean;
  setGeminiApiKey: (key: string) => void;
  setCriticOpen: (open: boolean) => void;
  runCritic: () => Promise<void>;
  applyCriticFix: (findingId: string) => void;
  setMarkdown: (markdown: string) => void;
  setThemeId: (themeId: string) => void;
  addCustomTheme: (theme: Theme) => void;
  /** Persist a custom theme without switching the active document theme. */
  saveCustomTheme: (theme: Theme) => void;
  setTemplate: (template: TemplateProfile | null) => void;
  updateTemplateMapping: (mapping: StyleMapping) => void;
  updateSettings: (settings: Partial<DocumentSettings>) => void;
  updateMetadata: (metadata: Partial<DocumentMetadata>) => void;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  setSettingsOpen: (open: boolean) => void;
  setAppSettingsOpen: (appSettingsOpen: boolean) => void;
  openThemeCreator: () => void;
  closeThemeCreator: () => void;
  setThemeDraft: (theme: Theme) => void;
  /** Save draft to the theme library (does not apply to the document). */
  saveThemeDraft: () => boolean;
  /** Save draft and apply it to the current document. */
  applyThemeDraft: () => boolean;
  setPreviewZoom: (zoom: PreviewZoom) => void;
  togglePrintPreview: () => void;
  toggleEditorFullscreen: () => void;
  refreshPreview: () => void;
  setDefaultThemeId: (themeId: string) => void;
  setDefaultExportFormat: (format: ExportFormat) => void;
  setDragDropError: (message: string) => void;
  newDocument: () => void;
  enabledPluginIds: string[];
  togglePluginId: (id: string) => void;
  revisions: Revision[];
  saveStatus: 'idle' | 'saving' | 'saved';
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  loadRevisions: () => Promise<void>;
  createRevisionSnapshot: () => Promise<void>;
  restoreRevision: (revision: Revision) => void;
  deleteRevisionFromStore: (id: number) => Promise<void>;
  clearAllRevisionsFromStore: () => Promise<void>;
}

function upsertTheme(themes: readonly Theme[], theme: Theme): Theme[] {
  const normalized = withThemeDefaults(theme);
  return [...themes.filter((item) => item.metadata.id !== normalized.metadata.id), normalized];
}

/** Resolves the active theme: custom themes first, then built-ins by id. */
export function resolveActiveTheme(
  themeId: string,
  customThemes: readonly Theme[],
): Theme | string {
  const custom = customThemes.find((theme) => theme.metadata.id === themeId);
  if (custom !== undefined) {
    return withThemeDefaults(custom);
  }
  return themeId;
}

/** Full theme object for the creator and branding-aware preview. */
export function resolveThemeObject(themeId: string, customThemes: readonly Theme[]): Theme {
  const custom = customThemes.find((theme) => theme.metadata.id === themeId);
  if (custom !== undefined) {
    return withThemeDefaults(custom);
  }
  const builtin = getBuiltinTheme(themeId);
  if (builtin !== undefined) {
    return withThemeDefaults(builtin);
  }
  return withThemeDefaults(getBuiltinTheme('minimal')!);
}

export function isBuiltinThemeId(themeId: string): boolean {
  return getBuiltinTheme(themeId) !== undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      themeCreatorOpen: false,
      themeDraft: null,
      previewZoom: 1,
      printPreview: false,
      editorFullscreen: false,
      previewRefreshNonce: 0,
      defaultThemeId: 'minimal',
      defaultExportFormat: 'docx',
      dragDropError: '',
      geminiApiKey: '',
      criticOpen: false,
      criticFindings: [],
      criticLoading: false,
      enabledPluginIds: ['latex', 'mermaid'],
      togglePluginId: (id) =>
        set((state) => ({
          enabledPluginIds: state.enabledPluginIds.includes(id)
            ? state.enabledPluginIds.filter((x) => x !== id)
            : [...state.enabledPluginIds, id],
        })),
      revisions: [],
      saveStatus: 'idle',
      historyOpen: false,
      setHistoryOpen: (historyOpen) =>
        set((state) => ({
          historyOpen,
          settingsOpen: historyOpen ? false : state.settingsOpen,
          appSettingsOpen: historyOpen ? false : state.appSettingsOpen,
          criticOpen: historyOpen ? false : state.criticOpen,
        })),
      loadRevisions: async () => {
        try {
          const revs = await getRevisions();
          set({ revisions: revs });
        } catch (err) {
          console.error('[db] Failed to load revisions:', err);
        }
      },
      createRevisionSnapshot: async () => {
        const { markdown, metadata } = get();
        if (!markdown.trim()) {
          return;
        }
        set({ saveStatus: 'saving' });
        try {
          const saved = await saveRevision(markdown, metadata.title);
          if (saved !== null) {
            const revs = await getRevisions();
            set({ revisions: revs, saveStatus: 'saved' });
            setTimeout(() => {
              if (get().saveStatus === 'saved') {
                set({ saveStatus: 'idle' });
              }
            }, 2500);
          } else {
            set({ saveStatus: 'idle' });
          }
        } catch (err) {
          console.error('[db] Failed to create snapshot:', err);
          set({ saveStatus: 'idle' });
        }
      },
      restoreRevision: (revision) => {
        set({
          markdown: revision.markdown,
          metadata: {
            ...get().metadata,
            title: revision.title,
          },
          saveStatus: 'idle',
        });
      },
      deleteRevisionFromStore: async (id) => {
        try {
          await deleteDbRevision(id);
          const revs = await getRevisions();
          set({ revisions: revs });
        } catch (err) {
          console.error('[db] Failed to delete revision:', err);
        }
      },
      clearAllRevisionsFromStore: async () => {
        try {
          await clearAllDbRevisions();
          set({ revisions: [] });
        } catch (err) {
          console.error('[db] Failed to clear revisions:', err);
        }
      },
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setCriticOpen: (criticOpen) =>
        set((state) => ({
          criticOpen,
          settingsOpen: criticOpen ? false : state.settingsOpen,
          appSettingsOpen: criticOpen ? false : state.appSettingsOpen,
          historyOpen: criticOpen ? false : state.historyOpen,
        })),
      runCritic: async () => {
        const { markdown, geminiApiKey } = get();
        set({ criticLoading: true });
        try {
          const doc = renderMarkdown(markdown).semanticDocument;
          const findings = await analyzeDocumentStructure(doc, geminiApiKey);
          set({ criticFindings: findings });
        } catch (err) {
          console.error('[ai-critic] Failed:', err);
        } finally {
          set({ criticLoading: false });
        }
      },
      applyCriticFix: (findingId) => {
        const { markdown } = get();
        if (findingId.startsWith('hierarchy-')) {
          const doc = renderMarkdown(markdown).semanticDocument;
          const part = findingId.split('-')[1];
          const idx = parseInt(part ?? '0', 10);
          const block = doc.children[idx];
          if (block && block.type === 'heading') {
            const currentLevel = block.level;
            let prevLevel = 0;
            for (let i = idx - 1; i >= 0; i--) {
              const child = doc.children[i];
              if (child && child.type === 'heading') {
                prevLevel = (child as { level: number }).level;
                break;
              }
            }
            const targetLevel = prevLevel === 0 ? 1 : prevLevel + 1;
            const currentHeaderPrefix = '#'.repeat(currentLevel) + ' ';
            const targetHeaderPrefix = '#'.repeat(targetLevel) + ' ';

            const textVal = block.children
              .map((c) => (c as { value?: string }).value || '')
              .join('')
              .trim();
            const lines = markdown.split('\n');
            const lineIndex = lines.findIndex(
              (line) => line.trim().startsWith(currentHeaderPrefix) && line.includes(textVal),
            );
            if (lineIndex !== -1) {
              const line = lines[lineIndex];
              if (line !== undefined) {
                lines[lineIndex] = line.replace(currentHeaderPrefix, targetHeaderPrefix);
                set({ markdown: lines.join('\n') });
                // Trigger critic rerun
                get().runCritic();
              }
            }
          }
        }
      },
      setMarkdown: (markdown) => set({ markdown }),

      setThemeId: (themeId) => set({ themeId }),
      addCustomTheme: (theme) =>
        set((state) => ({
          customThemes: upsertTheme(state.customThemes, theme),
          themeId: theme.metadata.id,
        })),
      saveCustomTheme: (theme) =>
        set((state) => ({
          customThemes: upsertTheme(state.customThemes, theme),
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
      setSettingsOpen: (settingsOpen) =>
        set((state) => ({
          settingsOpen,
          appSettingsOpen: settingsOpen ? false : state.appSettingsOpen,
          criticOpen: settingsOpen ? false : state.criticOpen,
          historyOpen: settingsOpen ? false : state.historyOpen,
        })),
      setAppSettingsOpen: (appSettingsOpen) =>
        set((state) => ({
          appSettingsOpen,
          settingsOpen: appSettingsOpen ? false : state.settingsOpen,
          criticOpen: appSettingsOpen ? false : state.criticOpen,
          historyOpen: appSettingsOpen ? false : state.historyOpen,
        })),
      openThemeCreator: () =>
        set((state) => ({
          themeCreatorOpen: true,
          themeDraft: createThemeDraft(resolveThemeObject(state.themeId, state.customThemes)),
          settingsOpen: false,
          appSettingsOpen: false,
          criticOpen: false,
          historyOpen: false,
        })),
      closeThemeCreator: () => set({ themeCreatorOpen: false, themeDraft: null }),
      setThemeDraft: (themeDraft) => set({ themeDraft: withThemeDefaults(themeDraft) }),
      saveThemeDraft: () => {
        let ok = false;
        set((state) => {
          if (state.themeDraft === null) {
            return {};
          }
          ok = true;
          return { customThemes: upsertTheme(state.customThemes, state.themeDraft) };
        });
        return ok;
      },
      applyThemeDraft: () => {
        let ok = false;
        set((state) => {
          if (state.themeDraft === null) {
            return {};
          }
          ok = true;
          const theme = withThemeDefaults(state.themeDraft);
          return {
            customThemes: upsertTheme(state.customThemes, theme),
            themeId: theme.metadata.id,
            themeDraft: theme,
          };
        });
        return ok;
      },
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
        geminiApiKey: state.geminiApiKey,
        enabledPluginIds: state.enabledPluginIds,
      }),
    },
  ),
);
