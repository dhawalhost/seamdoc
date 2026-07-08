/**
 * Visual theme creator: edit theme fields with live preview, then
 * Save (library), Apply (document), or Download JSON.
 */

import { useRef, useState } from 'react';
import { Check, Dices, Download, Loader2, Save, WandSparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { validateTheme, type Theme, type ThemeAlignment } from '@seamdoc/themes';
import { generateThemeFromPrompt } from '@seamdoc/core';
import { FEATURE_FLAGS } from '../lib/features';
import { DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import { downloadThemeJson } from '../lib/export';
import { useAppStore } from '../store';
import { FontFamilySelect } from './FontFamilySelect';
import { PreviewPane } from './PreviewPane';
import { TooltipButton } from './TooltipButton';
import { WebFontLoader } from './WebFontLoader';

const PREVIEW_MARKDOWN = `# Theme preview

Body text with **bold**, *italic*, and a [link](https://example.com).

## Section heading

1. Ordered item
2. Second item

> A block quote for chrome and accent checks.

\`\`\`typescript
const theme = 'live preview';
\`\`\`

| Column | Value |
| :----- | ----: |
| Ready  | Yes   |
`;

const fieldClass =
  'w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white';
const labelClass = 'block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1';
const sectionClass = 'flex flex-col gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-700';

const ALIGNMENTS: readonly ThemeAlignment[] = ['left', 'center', 'right', 'justify'];
const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug === '' ? 'custom-theme' : slug;
}

const TYPOGRAPHY_PAIRS = [
  { body: 'Inter', heading: 'Inter' },
  { body: 'Manrope', heading: 'Montserrat' },
  { body: 'Source Sans 3', heading: 'Source Sans 3' },
  { body: 'IBM Plex Sans', heading: 'IBM Plex Sans' },
  { body: 'Source Serif 4', heading: 'Source Sans 3' },
  { body: 'EB Garamond', heading: 'Playfair Display' },
  { body: 'Open Sans', heading: 'Inter' },
  { body: 'Lato', heading: 'Poppins' },
  { body: 'Nunito Sans', heading: 'Nunito' },
  { body: 'Karla', heading: 'Montserrat' },
  { body: 'Lora', heading: 'Playfair Display' },
  { body: 'DM Sans', heading: 'Outfit' },
  { body: 'Lora', heading: 'Libre Baskerville' },
  { body: 'Merriweather', heading: 'Source Serif 4' },
  { body: 'Segoe UI', heading: 'Segoe UI' },
];

const COLOR_STORIES = [
  {
    primary: '#2563eb',
    text: '#1f2933',
    accent: '#94a3b8',
    border: '#d9dde3',
    codeBackground: '#f4f5f7',
  },
  {
    primary: '#7c3aed',
    text: '#111827',
    accent: '#7c3aed',
    border: '#e5e7eb',
    codeBackground: '#f5f3ff',
  },
  {
    primary: '#0f766e',
    text: '#111827',
    accent: '#0f766e',
    border: '#9ca3af',
    codeBackground: '#f3f4f6',
  },
  {
    primary: '#1d4ed8',
    text: '#1f2933',
    accent: '#1d4ed8',
    border: '#cbd5e1',
    codeBackground: '#f1f5f9',
  },
  {
    primary: '#9d174d',
    text: '#292524',
    accent: '#9d174d',
    border: '#d6d3d1',
    codeBackground: '#faf7f5',
  },
  {
    primary: '#0284c7',
    text: '#1e293b',
    accent: '#0284c7',
    border: '#cbd5e1',
    codeBackground: '#f0f9ff',
  },
  {
    primary: '#e85d4c',
    text: '#3f2a28',
    accent: '#f4a261',
    border: '#f0d6d0',
    codeBackground: '#fff5f3',
  },
  {
    primary: '#0d9488',
    text: '#134e4a',
    accent: '#5eead4',
    border: '#ccfbf1',
    codeBackground: '#f0fdfa',
  },
  {
    primary: '#0e7490',
    text: '#164e63',
    accent: '#22d3ee',
    border: '#a5f3fc',
    codeBackground: '#ecfeff',
  },
  {
    primary: '#7e22ce',
    text: '#3b0764',
    accent: '#c084fc',
    border: '#e9d5ff',
    codeBackground: '#faf5ff',
  },
  {
    primary: '#4f46e5',
    text: '#1e1b4b',
    accent: '#818cf8',
    border: '#c7d2fe',
    codeBackground: '#eef2ff',
  },
  {
    primary: '#57534e',
    text: '#292524',
    accent: '#a8a29e',
    border: '#e7e5e4',
    codeBackground: '#fafaf9',
  },
  {
    primary: '#166534',
    text: '#14532d',
    accent: '#4ade80',
    border: '#bbf7d0',
    codeBackground: '#f0fdfa',
  },
  {
    primary: '#b91c1c',
    text: '#1f2937',
    accent: '#f87171',
    border: '#fecaca',
    codeBackground: '#fef2f2',
  },
];

const THEME_NAME_ADJECTIVES = [
  'Vintage',
  'Cosmic',
  'Spearmint',
  'Sunset',
  'Forest',
  'Oceanic',
  'Slate',
  'Minimalist',
  'Nordic',
  'Elegant',
  'Midnight',
  'Academic',
  'Geometric',
  'Warm',
  'Royal',
  'Corporate',
];

const THEME_NAME_NOUNS = [
  'Breeze',
  'Sage',
  'Stardust',
  'Velvet',
  'Splash',
  'Deep',
  'Paper',
  'Focus',
  'Aesthetic',
  'Journal',
  'Deck',
  'Facet',
  'Slice',
  'Outline',
  'Standard',
  'Brief',
];

export function ThemeCreatorPanel() {
  const { t } = useTranslation();
  const {
    themeDraft,
    settings,
    setThemeDraft,
    saveThemeDraft,
    applyThemeDraft,
    closeThemeCreator,
    updateSettings,
    geminiApiKey,
  } = useAppStore();
  const logoInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);

  if (themeDraft === null) {
    return null;
  }

  const draft = themeDraft;

  const updateDraft = (next: Theme) => {
    setError('');
    setStatus('');
    setThemeDraft(next);
  };

  const onGenerateRandomTheme = () => {
    const adj =
      THEME_NAME_ADJECTIVES[Math.floor(Math.random() * THEME_NAME_ADJECTIVES.length)] ?? 'Custom';
    const noun = THEME_NAME_NOUNS[Math.floor(Math.random() * THEME_NAME_NOUNS.length)] ?? 'Style';
    const randomName = `${adj} ${noun}`;
    const randomId = `${slugify(randomName)}-custom-${Math.floor(100 + Math.random() * 900)}`;

    const typo = TYPOGRAPHY_PAIRS[Math.floor(Math.random() * TYPOGRAPHY_PAIRS.length)] ?? {
      body: 'Inter',
      heading: 'Inter',
    };
    const colors = COLOR_STORIES[Math.floor(Math.random() * COLOR_STORIES.length)] ?? {
      primary: '#2563eb',
      text: '#1f2933',
      accent: '#94a3b8',
      border: '#d9dde3',
      codeBackground: '#f4f5f7',
    };

    const bodySize = Math.floor(10 + Math.random() * 3);
    const lh = parseFloat((1.2 + Math.random() * 0.45).toFixed(2));
    const h1Size = Math.round(bodySize * (2.0 + Math.random() * 0.6));
    const h2Size = Math.round(h1Size * 0.8);
    const h3Size = Math.round(h1Size * 0.65);
    const h4Size = Math.round(h1Size * 0.55);
    const h5Size = Math.round(h1Size * 0.48);
    const h6Size = Math.round(h1Size * 0.43);

    const randomTheme: Theme = {
      schemaVersion: 1,
      metadata: {
        id: randomId,
        name: randomName,
        version: '1.0.0',
        author: 'Seamdoc Randomizer',
        description: `Completely random theme combination using ${typo.heading} and ${typo.body}.`,
        license: 'MIT',
      },
      typography: {
        body: typo.body,
        heading: typo.heading,
        code: 'Courier New',
      },
      colors: {
        primary: colors.primary,
        text: colors.text,
        background: '#ffffff',
        border: colors.border,
        accent: colors.accent,
        codeBackground: colors.codeBackground,
      },
      headings: {
        h1: {
          fontFamily: typo.heading,
          fontSize: h1Size,
          fontWeight: 700,
          italic: false,
          color: colors.primary,
          alignment: 'left',
          spacing: { before: Math.round(h1Size * 0.9), after: Math.round(h1Size * 0.45) },
        },
        h2: {
          fontFamily: typo.heading,
          fontSize: h2Size,
          fontWeight: 700,
          italic: false,
          color: colors.primary,
          alignment: 'left',
          spacing: { before: Math.round(h2Size * 0.9), after: Math.round(h2Size * 0.45) },
        },
        h3: {
          fontFamily: typo.heading,
          fontSize: h3Size,
          fontWeight: 600,
          italic: false,
          color: colors.primary,
          alignment: 'left',
          spacing: { before: Math.round(h3Size * 0.9), after: Math.round(h3Size * 0.45) },
        },
        h4: {
          fontFamily: typo.heading,
          fontSize: h4Size,
          fontWeight: 600,
          italic: false,
          color: colors.primary,
          alignment: 'left',
          spacing: { before: Math.round(h4Size * 0.9), after: Math.round(h4Size * 0.45) },
        },
        h5: {
          fontFamily: typo.heading,
          fontSize: h5Size,
          fontWeight: 600,
          italic: false,
          color: colors.primary,
          alignment: 'left',
          spacing: { before: Math.round(h5Size * 0.9), after: Math.round(h5Size * 0.45) },
        },
        h6: {
          fontFamily: typo.heading,
          fontSize: h6Size,
          fontWeight: 600,
          italic: false,
          color: colors.primary,
          alignment: 'left',
          spacing: { before: Math.round(h6Size * 0.9), after: Math.round(h6Size * 0.45) },
        },
      },
      paragraph: {
        fontFamily: typo.body,
        fontSize: bodySize,
        fontWeight: 400,
        italic: false,
        color: colors.text,
        alignment: 'left',
        lineHeight: lh,
        spacing: { before: 0, after: Math.round(bodySize * 0.75) },
      },
      list: { indent: 24, spacing: { before: 2, after: 2 } },
      table: {
        headerBackground: colors.codeBackground,
        headerColor: colors.primary,
        headerFontWeight: 700,
        borderColor: colors.border,
        borderWidth: 0.75,
        cellPadding: 5,
      },
      image: { alignment: 'center', maxWidth: 451, spacing: { before: 8, after: 8 } },
      code: {
        fontFamily: 'Courier New',
        fontSize: Math.round(bodySize * 0.9),
        color: colors.text,
        background: colors.codeBackground,
        padding: 8,
        spacing: { before: 8, after: 8 },
      },
      quote: {
        borderColor: colors.accent,
        borderWidth: 3,
        color: colors.text,
        italic: true,
        indent: 18,
        spacing: { before: 8, after: 8 },
      },
      link: { color: colors.primary, underline: true },
      horizontalRule: { color: colors.border, thickness: 1, spacing: { before: 12, after: 12 } },
      branding: {
        logo: '',
        headerBackground: colors.codeBackground,
        headerTextColor: colors.primary,
        showLogo: false,
      },
    };

    updateDraft(randomTheme);
    setStatus(t('randomThemeSuccess'));
  };

  const onPromptTheme = async () => {
    if (!geminiApiKey) {
      setError('Please configure your Gemini API Key in App Preferences first.');
      return;
    }
    if (!promptText.trim()) {
      setError('Please enter a description for the theme.');
      return;
    }
    setPromptLoading(true);
    setError('');
    setStatus('');
    try {
      const generated = await generateThemeFromPrompt(promptText, geminiApiKey);
      updateDraft(generated);
      setStatus('Theme generated successfully from prompt!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to generate theme.');
    } finally {
      setPromptLoading(false);
    }
  };

  const patchMetadata = (partial: Partial<Theme['metadata']>) => {
    const metadata = { ...draft.metadata, ...partial };
    if (partial.name !== undefined && !draft.metadata.id.includes('-custom')) {
      metadata.id = `${slugify(partial.name)}-custom`;
    } else if (partial.name !== undefined) {
      metadata.id = `${slugify(partial.name)}-custom`;
    }
    updateDraft({ ...draft, metadata });
  };

  const validateDraft = (): Theme | null => {
    const result = validateTheme(draft);
    if (!result.valid || result.theme === null) {
      setError(result.errors[0] ?? 'Theme is invalid.');
      return null;
    }
    return result.theme;
  };

  const onSave = () => {
    const theme = validateDraft();
    if (theme === null) {
      return;
    }
    setThemeDraft(theme);
    if (saveThemeDraft()) {
      setStatus(`Saved “${theme.metadata.name}” to your theme library.`);
    }
  };

  const onApply = () => {
    const theme = validateDraft();
    if (theme === null) {
      return;
    }
    setThemeDraft(theme);
    if (applyThemeDraft()) {
      setStatus(`Applied “${theme.metadata.name}” to this document.`);
    }
  };

  const onDownload = () => {
    const theme = validateDraft();
    if (theme === null) {
      return;
    }
    downloadThemeJson(theme);
    setStatus(`Downloaded ${theme.metadata.id}-theme.json.`);
  };

  const onLogoFile = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Logo must be an image file.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
    if (!dataUrl.startsWith('data:image/')) {
      setError('Logo must be embeddable as a data URL.');
      return;
    }
    updateDraft({
      ...draft,
      branding: { ...draft.branding, logo: dataUrl, showLogo: true },
    });
  };

  const previewFonts = [
    draft.typography.body,
    draft.typography.heading,
    draft.typography.code,
    draft.paragraph.fontFamily,
    draft.code.fontFamily,
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-neutral-50 dark:bg-neutral-950"
      data-testid="theme-creator"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-creator-heading"
    >
      <WebFontLoader families={previewFonts} />
      <header className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900">
        <WandSparkles size={18} className="text-blue-600" />
        <h2
          id="theme-creator-heading"
          className="text-sm font-semibold text-neutral-900 dark:text-white"
        >
          {t('themeCreatorTitle')}
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('designVisually')}
        </span>
        <div className="flex-1" />
        {error !== '' && (
          <span role="alert" data-testid="theme-creator-error" className="text-xs text-red-600">
            {error}
          </span>
        )}
        {status !== '' && (
          <span
            data-testid="theme-creator-status"
            className="text-xs text-green-700 dark:text-green-400"
          >
            {status}
          </span>
        )}
        <button
          type="button"
          data-testid="theme-creator-save"
          onClick={onSave}
          className="flex items-center gap-1 rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          title="Save to your local theme library without applying"
        >
          <Save size={14} />
          {t('save')}
        </button>
        <button
          type="button"
          data-testid="theme-creator-apply"
          onClick={onApply}
          className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          title="Save and apply this theme to the current document"
        >
          <Check size={14} />
          {t('apply')}
        </button>
        <button
          type="button"
          data-testid="theme-creator-download"
          onClick={onDownload}
          className="flex items-center gap-1 rounded border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-neutral-800"
          title="Download theme JSON to share or import later"
        >
          <Download size={14} />
          {t('downloadJson')}
        </button>
        <TooltipButton
          tooltip={t('closeThemeCreator')}
          aria-label={t('closeThemeCreator')}
          onClick={closeThemeCreator}
          data-testid="theme-creator-close"
          placement="top"
          className="rounded p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={16} />
        </TooltipButton>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex w-full flex-col gap-4 overflow-y-auto border-b border-neutral-200 p-4 md:w-96 md:border-b-0 md:border-r dark:border-neutral-700">
          {FEATURE_FLAGS.enableAi && (
            <section className={sectionClass}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1">
                <WandSparkles size={12} className="text-yellow-500 fill-yellow-500" />
                AI Theme Generator
              </h3>
              <div>
                <label className={labelClass} htmlFor="ai-prompt-input">
                  Prompt your theme (colors, vibes, fonts)
                </label>
                <textarea
                  id="ai-prompt-input"
                  data-testid="theme-creator-prompt"
                  placeholder="e.g. Minimalist design for a clinical study with dark forest green headers"
                  className={fieldClass}
                  rows={2}
                  value={promptText}
                  onChange={(event) => setPromptText(event.target.value)}
                />
              </div>
              <button
                type="button"
                data-testid="theme-creator-prompt-submit"
                disabled={promptLoading}
                onClick={onPromptTheme}
                className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
              >
                {promptLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Generating Theme...
                  </>
                ) : (
                  <>
                    <WandSparkles size={12} />
                    Generate Theme
                  </>
                )}
              </button>
            </section>
          )}

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1">
              <Dices size={12} className="text-blue-600 dark:text-blue-400" />
              {t('themeRandomizerTitle')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('randomThemeLabel')}
            </p>
            <button
              type="button"
              data-testid="theme-creator-randomize"
              onClick={onGenerateRandomTheme}
              className="flex w-full items-center justify-center gap-2 rounded bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <Dices size={12} />
              {t('randomThemeButton')}
            </button>
          </section>

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Identity
            </h3>

            <div>
              <label className={labelClass} htmlFor="theme-name">
                Name
              </label>
              <input
                id="theme-name"
                data-testid="theme-creator-name"
                className={fieldClass}
                value={draft.metadata.name}
                onChange={(event) => patchMetadata({ name: event.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="theme-id">
                Id (used in filenames)
              </label>
              <input
                id="theme-id"
                data-testid="theme-creator-id"
                className={fieldClass}
                value={draft.metadata.id}
                onChange={(event) =>
                  patchMetadata({ id: slugify(event.target.value) || 'custom-theme' })
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="theme-author">
                Author
              </label>
              <input
                id="theme-author"
                className={fieldClass}
                value={draft.metadata.author}
                onChange={(event) => patchMetadata({ author: event.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="theme-description">
                Description
              </label>
              <textarea
                id="theme-description"
                className={fieldClass}
                rows={2}
                value={draft.metadata.description}
                onChange={(event) => patchMetadata({ description: event.target.value })}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Page chrome & logo
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Header bar and logo appear in the live preview. Use a local image (stored as a data
              URL — never uploaded).
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass} htmlFor="header-bg">
                  Header background
                </label>
                <input
                  id="header-bg"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.branding.headerBackground}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      branding: { ...draft.branding, headerBackground: event.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="header-fg">
                  Header text color
                </label>
                <input
                  id="header-fg"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.branding.headerTextColor}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      branding: { ...draft.branding, headerTextColor: event.target.value },
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                data-testid="theme-creator-show-logo"
                checked={draft.branding.showLogo}
                onChange={(event) =>
                  updateDraft({
                    ...draft,
                    branding: { ...draft.branding, showLogo: event.target.checked },
                  })
                }
              />
              Show logo in header
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="theme-creator-logo"
                onClick={() => logoInput.current?.click()}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600"
              >
                Upload logo
              </button>
              {draft.branding.logo !== '' && (
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({
                      ...draft,
                      branding: { ...draft.branding, logo: '', showLogo: false },
                    })
                  }
                  className="text-xs text-red-600"
                >
                  Remove logo
                </button>
              )}
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void onLogoFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>
            {draft.branding.logo !== '' && (
              <img
                src={draft.branding.logo}
                alt="Theme logo preview"
                className="max-h-12 max-w-full object-contain"
              />
            )}
            <div>
              <label className={labelClass} htmlFor="doc-header-text">
                Header text (document)
              </label>
              <input
                id="doc-header-text"
                className={fieldClass}
                value={settings.header}
                onChange={(event) => updateSettings({ header: event.target.value })}
                placeholder="Shown in the header bar"
              />
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Colors
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['primary', 'Primary'],
                  ['text', 'Text'],
                  ['background', 'Background'],
                  ['border', 'Border'],
                  ['accent', 'Accent'],
                  ['codeBackground', 'Code background'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className={labelClass} htmlFor={`color-${key}`}>
                    {label}
                  </label>
                  <input
                    id={`color-${key}`}
                    type="color"
                    className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                    value={draft.colors[key]}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        colors: { ...draft.colors, [key]: event.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Typography
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Choose from the catalog (system and web fonts) or Custom for any family name. Web
              fonts load for preview only; DOCX keeps the name, PDF maps to a standard substitute.
            </p>
            {(
              [
                ['body', 'Body font'],
                ['heading', 'Heading font'],
                ['code', 'Code font'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className={labelClass} htmlFor={`font-${key}`}>
                  {label}
                </label>
                <FontFamilySelect
                  id={`font-${key}`}
                  data-testid={`theme-creator-font-${key}`}
                  className={fieldClass}
                  value={draft.typography[key]}
                  onChange={(fontFamily) => {
                    const next: Theme = {
                      ...draft,
                      typography: { ...draft.typography, [key]: fontFamily },
                    };
                    if (key === 'body') {
                      next.paragraph = { ...draft.paragraph, fontFamily };
                    }
                    if (key === 'heading') {
                      next.headings = Object.fromEntries(
                        HEADING_LEVELS.map((level) => [
                          level,
                          { ...draft.headings[level], fontFamily },
                        ]),
                      ) as Theme['headings'];
                    }
                    if (key === 'code') {
                      next.code = { ...draft.code, fontFamily };
                    }
                    updateDraft(next);
                  }}
                />
              </div>
            ))}
          </section>

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Headings
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass} htmlFor="heading-color">
                  Heading color
                </label>
                <input
                  id="heading-color"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.headings.h1.color}
                  onChange={(event) => {
                    const color = event.target.value;
                    updateDraft({
                      ...draft,
                      headings: Object.fromEntries(
                        HEADING_LEVELS.map((level) => [level, { ...draft.headings[level], color }]),
                      ) as Theme['headings'],
                    });
                  }}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="heading-weight">
                  Heading weight
                </label>
                <input
                  id="heading-weight"
                  type="number"
                  min={100}
                  max={900}
                  step={100}
                  className={fieldClass}
                  value={draft.headings.h1.fontWeight}
                  onChange={(event) => {
                    const fontWeight = Number(event.target.value);
                    if (Number.isNaN(fontWeight)) {
                      return;
                    }
                    updateDraft({
                      ...draft,
                      headings: Object.fromEntries(
                        HEADING_LEVELS.map((level) => [
                          level,
                          { ...draft.headings[level], fontWeight },
                        ]),
                      ) as Theme['headings'],
                    });
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {HEADING_LEVELS.map((level) => (
                <div key={level}>
                  <label className={labelClass} htmlFor={`size-${level}`}>
                    {level.toUpperCase()} size
                  </label>
                  <input
                    id={`size-${level}`}
                    type="number"
                    min={8}
                    className={fieldClass}
                    value={draft.headings[level].fontSize}
                    onChange={(event) => {
                      const fontSize = Number(event.target.value);
                      if (Number.isNaN(fontSize) || fontSize <= 0) {
                        return;
                      }
                      updateDraft({
                        ...draft,
                        headings: {
                          ...draft.headings,
                          [level]: { ...draft.headings[level], fontSize },
                        },
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Paragraph
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass} htmlFor="para-size">
                  Size (pt)
                </label>
                <input
                  id="para-size"
                  type="number"
                  min={8}
                  className={fieldClass}
                  value={draft.paragraph.fontSize}
                  onChange={(event) => {
                    const fontSize = Number(event.target.value);
                    if (Number.isNaN(fontSize) || fontSize <= 0) {
                      return;
                    }
                    updateDraft({
                      ...draft,
                      paragraph: { ...draft.paragraph, fontSize },
                    });
                  }}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="para-line">
                  Line height
                </label>
                <input
                  id="para-line"
                  type="number"
                  min={0.5}
                  step={0.05}
                  className={fieldClass}
                  value={draft.paragraph.lineHeight}
                  onChange={(event) => {
                    const lineHeight = Number(event.target.value);
                    if (Number.isNaN(lineHeight) || lineHeight <= 0) {
                      return;
                    }
                    updateDraft({
                      ...draft,
                      paragraph: { ...draft.paragraph, lineHeight },
                    });
                  }}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="para-color">
                  Text color
                </label>
                <input
                  id="para-color"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.paragraph.color}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      paragraph: { ...draft.paragraph, color: event.target.value },
                      colors: { ...draft.colors, text: event.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="para-align">
                  Alignment
                </label>
                <select
                  id="para-align"
                  className={fieldClass}
                  value={draft.paragraph.alignment}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      paragraph: {
                        ...draft.paragraph,
                        alignment: event.target.value as ThemeAlignment,
                      },
                    })
                  }
                >
                  {ALIGNMENTS.map((alignment) => (
                    <option key={alignment} value={alignment}>
                      {alignment}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Links & accents
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass} htmlFor="link-color">
                  Link color
                </label>
                <input
                  id="link-color"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.link.color}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      link: { ...draft.link, color: event.target.value },
                      colors: { ...draft.colors, primary: event.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="quote-border">
                  Quote border
                </label>
                <input
                  id="quote-border"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.quote.borderColor}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      quote: { ...draft.quote, borderColor: event.target.value },
                      colors: { ...draft.colors, accent: event.target.value },
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={draft.link.underline}
                onChange={(event) =>
                  updateDraft({
                    ...draft,
                    link: { ...draft.link, underline: event.target.checked },
                  })
                }
              />
              Underline links
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={draft.quote.italic}
                onChange={(event) =>
                  updateDraft({
                    ...draft,
                    quote: { ...draft.quote, italic: event.target.checked },
                  })
                }
              />
              Italic quotes
            </label>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Code blocks
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass} htmlFor="code-bg">
                  Background
                </label>
                <input
                  id="code-bg"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.code.background}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      code: { ...draft.code, background: event.target.value },
                      colors: { ...draft.colors, codeBackground: event.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="code-fg">
                  Text
                </label>
                <input
                  id="code-fg"
                  type="color"
                  className="h-9 w-full cursor-pointer rounded border border-neutral-300 dark:border-neutral-600"
                  value={draft.code.color}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      code: { ...draft.code, color: event.target.value },
                    })
                  }
                />
              </div>
            </div>
          </section>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label="Theme live preview">
          <div className="border-b border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            Live preview
          </div>
          <PreviewPane
            markdown={PREVIEW_MARKDOWN}
            theme={draft}
            settings={{
              ...DEFAULT_DOCUMENT_SETTINGS,
              ...settings,
              header: settings.header === '' ? draft.metadata.name : settings.header,
            }}
            zoom={0.85}
            printPreview={false}
            refreshNonce={0}
          />
        </section>
      </div>
    </div>
  );
}
