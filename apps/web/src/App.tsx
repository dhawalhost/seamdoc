import { Suspense, lazy, useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { resolveActiveTheme, resolveThemeObject, useAppStore } from './store';
import type { EditorPaneHandle } from './components/EditorPane';
import { PreviewPane, type PreviewPaneHandle } from './components/PreviewPane';
import { PreviewToolbar } from './components/PreviewToolbar';
import { EditorToolbar } from './components/EditorToolbar';
import { Toolbar } from './components/Toolbar';
import { SettingsPanel } from './components/SettingsPanel';
import { AppSettingsPanel } from './components/AppSettingsPanel';
import { ThemeCreatorPanel } from './components/ThemeCreatorPanel';
import { CriticPanel } from './components/CriticPanel';
import { WebFontLoader } from './components/WebFontLoader';
import { ExportWizard } from './components/ExportWizard';
import { NotionImportPanel } from './components/NotionImportPanel';
import { importFile, isSupportedFile, FORMAT_LABELS } from './lib/importFile';
import { FEATURE_FLAGS } from './lib/features';

const EditorPane = lazy(async () => {
  const module = await import('./components/EditorPane');
  return { default: module.EditorPane };
});

type ScrollSource = 'none' | 'editor' | 'preview';

export default function App() {
  const {
    markdown,
    themeId,
    customThemes,
    settings,
    darkMode,
    highContrast,
    settingsOpen,
    appSettingsOpen,
    themeCreatorOpen,
    criticOpen,
    previewZoom,
    printPreview,
    editorFullscreen,
    previewRefreshNonce,
    dragDropError,
    setMarkdown,
    setDragDropError,
  } = useAppStore();
  const [dragging, setDragging] = useState(false);
  const [exportWizardOpen, setExportWizardOpen] = useState(false);
  const [notionImportOpen, setNotionImportOpen] = useState(false);
  const editorRef = useRef<EditorPaneHandle>(null);
  const previewRef = useRef<PreviewPaneHandle>(null);
  const scrollSource = useRef<ScrollSource>('none');
  const dragDepth = useRef(0);

  const syncPreviewScroll = useCallback((ratio: number) => {
    if (scrollSource.current === 'preview') {
      return;
    }
    scrollSource.current = 'editor';
    previewRef.current?.scrollToRatio(ratio);
    requestAnimationFrame(() => {
      scrollSource.current = 'none';
    });
  }, []);

  const syncEditorScroll = useCallback((ratio: number) => {
    if (scrollSource.current === 'editor') {
      return;
    }
    scrollSource.current = 'preview';
    editorRef.current?.scrollToRatio(ratio);
    requestAnimationFrame(() => {
      scrollSource.current = 'none';
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  const onDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      setDragDropError('');

      const files = [...event.dataTransfer.files];
      if (files.length !== 1) {
        setDragDropError('Drop a single file (.md, .html, .mdx, .adoc).');
        return;
      }

      const file = files[0];
      if (file === undefined || !isSupportedFile(file.name)) {
        setDragDropError(
          `Unsupported file. Supported formats: ${Object.values(FORMAT_LABELS).join(', ')}.`,
        );
        return;
      }

      try {
        const result = await importFile(file);
        setMarkdown(result.markdown);
      } catch (error) {
        setDragDropError(error instanceof Error ? error.message : 'Failed to import file.');
      }
    },
    [setDragDropError, setMarkdown],
  );

  const showEditor = !printPreview;
  const showPreview = !editorFullscreen;
  const activeTheme = resolveThemeObject(themeId, customThemes);
  const previewFonts = [
    activeTheme.typography.body,
    activeTheme.typography.heading,
    activeTheme.typography.code,
    settings.fontFamily ?? '',
  ];

  return (
    <div
      className="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950"
      data-testid="app-drop-zone"
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(event) => void onDrop(event)}
    >
      <WebFontLoader families={previewFonts} />
      <a href="#main-content" className="skip-link">
        Skip to editor
      </a>
      <Toolbar
        onOpenExportWizard={() => setExportWizardOpen(true)}
        onOpenNotionImport={() => setNotionImportOpen(true)}
      />
      {dragDropError !== '' && (
        <div
          role="alert"
          data-testid="drag-drop-error"
          className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {dragDropError}
        </div>
      )}
      <main
        id="main-content"
        className="flex min-h-0 flex-1 flex-col md:flex-row"
        aria-label="Editor and preview"
      >
        {showEditor && (
          <section
            className={`flex min-h-0 min-w-0 flex-1 flex-col border-neutral-200 dark:border-neutral-700 ${
              showPreview ? 'border-b md:border-b-0 md:border-r' : ''
            }`}
            aria-label="Markdown editor"
          >
            <EditorToolbar
              onFind={() => editorRef.current?.openFind()}
              onReplace={() => editorRef.current?.openReplace()}
              onInsertPageBreak={() => editorRef.current?.insertText('\n\n<!-- pagebreak -->\n\n')}
            />

            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                  Loading editor…
                </div>
              }
            >
              <EditorPane
                ref={editorRef}
                value={markdown}
                darkMode={darkMode}
                onChange={setMarkdown}
                {...(showPreview ? { onScrollRatio: syncPreviewScroll } : {})}
              />
            </Suspense>
          </section>
        )}
        {showPreview && (
          <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label="Live preview">
            <PreviewToolbar />
            <PreviewPane
              ref={previewRef}
              markdown={markdown}
              theme={resolveActiveTheme(themeId, customThemes)}
              settings={settings}
              zoom={previewZoom}
              printPreview={printPreview}
              refreshNonce={previewRefreshNonce}
              {...(showEditor ? { onScrollRatio: syncEditorScroll } : {})}
            />
          </section>
        )}
        {settingsOpen && <SettingsPanel />}
        {appSettingsOpen && <AppSettingsPanel />}
        {FEATURE_FLAGS.enableAi && criticOpen && <CriticPanel />}
      </main>
      {themeCreatorOpen && <ThemeCreatorPanel />}
      {exportWizardOpen && <ExportWizard onClose={() => setExportWizardOpen(false)} />}
      {notionImportOpen && (
        <NotionImportPanel
          onClose={() => setNotionImportOpen(false)}
          onImport={(md) => setMarkdown(md)}
        />
      )}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-blue-600/20">
          <p className="rounded-xl bg-white px-6 py-4 text-center shadow-2xl dark:bg-neutral-800">
            <span className="block text-lg font-semibold text-neutral-900 dark:text-white">
              Drop to import
            </span>
            <span className="mt-1 block text-sm text-neutral-500 dark:text-neutral-400">
              Markdown, HTML, MDX, or AsciiDoc
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
