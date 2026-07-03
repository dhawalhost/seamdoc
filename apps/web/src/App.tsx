import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveActiveTheme, useAppStore } from './store';
import { EditorPane } from './components/EditorPane';
import { PreviewPane } from './components/PreviewPane';
import { Toolbar } from './components/Toolbar';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const { markdown, themeId, customThemes, settings, darkMode, settingsOpen, setMarkdown } =
    useAppStore();
  const [dragging, setDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  // Counter instead of boolean: dragenter/dragleave fire per child element.
  const dragDepth = useRef(0);

  const syncPreviewScroll = useCallback((ratio: number) => {
    const preview = previewRef.current;
    if (preview !== null) {
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file !== undefined && (file.name.endsWith('.md') || file.type === 'text/markdown')) {
        setMarkdown(await file.text());
      }
    },
    [setMarkdown],
  );

  return (
    <div
      className="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950"
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
      <Toolbar />
      <main className="flex min-h-0 flex-1">
        <section className="min-w-0 flex-1 border-r border-neutral-200 dark:border-neutral-700">
          <EditorPane
            value={markdown}
            darkMode={darkMode}
            onChange={setMarkdown}
            onScrollRatio={syncPreviewScroll}
          />
        </section>
        <section className="min-w-0 flex-1">
          <PreviewPane
            ref={previewRef}
            markdown={markdown}
            theme={resolveActiveTheme(themeId, customThemes)}
            settings={settings}
          />
        </section>
        {settingsOpen && <SettingsPanel />}
      </main>
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
