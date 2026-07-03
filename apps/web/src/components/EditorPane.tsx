/** Markdown editor built on Monaco, bundled locally for offline use. */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
  getWorker: () => new editorWorker(),
};
loader.config({ monaco });

export interface EditorPaneHandle {
  scrollToRatio: (ratio: number) => void;
  openFind: () => void;
  openReplace: () => void;
}

interface EditorPaneProps {
  value: string;
  darkMode: boolean;
  onChange: (value: string) => void;
  /** Reports vertical scroll position as a 0..1 ratio for preview sync. */
  onScrollRatio?: (ratio: number) => void;
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(function EditorPane(
  { value, darkMode, onChange, onScrollRatio },
  ref,
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const suppressScrollEvent = useRef(false);

  useImperativeHandle(ref, () => ({
    scrollToRatio(ratio: number) {
      const editor = editorRef.current;
      if (editor === null) {
        return;
      }
      const range = editor.getScrollHeight() - editor.getLayoutInfo().height;
      if (range <= 0) {
        return;
      }
      suppressScrollEvent.current = true;
      editor.setScrollTop(ratio * range);
      requestAnimationFrame(() => {
        suppressScrollEvent.current = false;
      });
    },
    openFind() {
      editorRef.current?.getAction('actions.find')?.run();
    },
    openReplace() {
      editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run();
    },
  }));

  return (
    <div className="h-full" data-testid="editor">
      <Editor
        language="markdown"
        value={value}
        theme={darkMode ? 'vs-dark' : 'light'}
        onChange={(next) => onChange(next ?? '')}
        onMount={(editor) => {
          editorRef.current = editor;
          editor.onDidScrollChange((event) => {
            if (suppressScrollEvent.current) {
              return;
            }
            const range = event.scrollHeight - editor.getLayoutInfo().height;
            if (range > 0 && onScrollRatio !== undefined) {
              onScrollRatio(Math.min(1, Math.max(0, event.scrollTop / range)));
            }
          });
        }}
        options={{
          wordWrap: 'on',
          lineNumbers: 'on',
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          ariaLabel: 'Markdown editor',
        }}
      />
    </div>
  );
});
