/**
 * Application state (Zustand). Global state holds application-level data
 * only; editor internals stay local to components. Document content and
 * preferences persist to localStorage so work survives reloads (auto save)
 * while never leaving the device (privacy doctrine).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocumentMetadata, DocumentSettings } from '@seamdoc/types';
import { DEFAULT_DOCUMENT_METADATA, DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import { getBuiltinTheme, type Theme } from '@seamdoc/themes';

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
  darkMode: boolean;
  settingsOpen: boolean;
  setMarkdown: (markdown: string) => void;
  setThemeId: (themeId: string) => void;
  addCustomTheme: (theme: Theme) => void;
  updateSettings: (settings: Partial<DocumentSettings>) => void;
  updateMetadata: (metadata: Partial<DocumentMetadata>) => void;
  toggleDarkMode: () => void;
  setSettingsOpen: (open: boolean) => void;
  newDocument: () => void;
}

/** Resolves the active theme: custom themes first, then built-ins by id. */
export function resolveActiveTheme(themeId: string, customThemes: readonly Theme[]): Theme | string {
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
      darkMode: false,
      settingsOpen: false,
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
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      updateMetadata: (partial) =>
        set((state) => ({ metadata: { ...state.metadata, ...partial } })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      newDocument: () => set({ markdown: '' }),
    }),
    {
      name: 'seamdoc',
      partialize: (state) => ({
        markdown: state.markdown,
        themeId: state.themeId,
        settings: state.settings,
        metadata: state.metadata,
        customThemes: state.customThemes,
        darkMode: state.darkMode,
      }),
    },
  ),
);
