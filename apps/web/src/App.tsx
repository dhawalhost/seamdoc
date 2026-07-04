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
import { WebFontLoader } from './components/WebFontLoader';

const EditorPane = lazy(async () => {
  const module = await import('./components/EditorPane');
  return { default: module.EditorPane };
});

type ScrollSource = 'none' | 'editor' | 'preview';

function isMarkdownFile(file: File): boolean {
  return (
    file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.type === 'text/markdown'
  );
}

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
    previewZoom,
    printPreview,
    editorFullscreen,
    previewRefreshNonce,
    dragDropError,
    setMarkdown,
    setDragDropError,
  } = useAppStore();
  const [dragging, setDragging] = useState(false);
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
        setDragDropError('Drop a single Markdown (.md) file.');
        return;
      }

      const file = files[0];
      if (file === undefined || !isMarkdownFile(file)) {
        setDragDropError('Only Markdown (.md) files are supported.');
        return;
      }

      setMarkdown(await file.text());
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
      <Toolbar />
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
      </main>
      {themeCreatorOpen && <ThemeCreatorPanel />}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-blue-600/20">
          <p className="rounded bg-white px-6 py-3 text-lg font-medium shadow-lg dark:bg-neutral-800 dark:text-white">
            Drop your Markdown file to open it
          </p>
        </div>
      )}
    </div>
  );
}
