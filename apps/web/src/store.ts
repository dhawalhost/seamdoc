/**
 * Application state (Zustand). Global state holds application-level data
 * only; editor internals stay local to components. Document content and
 * preferences persist to localStorage so work survives reloads (auto save)
 * while never leaving the device (privacy doctrine).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocumentSettings } from '@seamdoc/types';
import { DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';

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
  darkMode: boolean;
  settingsOpen: boolean;
  setMarkdown: (markdown: string) => void;
  setThemeId: (themeId: string) => void;
  updateSettings: (settings: Partial<DocumentSettings>) => void;
  toggleDarkMode: () => void;
  setSettingsOpen: (open: boolean) => void;
  newDocument: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      markdown: SAMPLE_MARKDOWN,
      themeId: 'minimal',
      settings: DEFAULT_DOCUMENT_SETTINGS,
      darkMode: false,
      settingsOpen: false,
      setMarkdown: (markdown) => set({ markdown }),
      setThemeId: (themeId) => set({ themeId }),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
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
        darkMode: state.darkMode,
      }),
    },
  ),
);
