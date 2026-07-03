/** Markdown editor built on Monaco, bundled locally for offline use. */

import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
  getWorker: () => new editorWorker(),
};
loader.config({ monaco });

interface EditorPaneProps {
  value: string;
  darkMode: boolean;
  onChange: (value: string) => void;
  /** Reports vertical scroll position as a 0..1 ratio for preview sync. */
  onScrollRatio?: (ratio: number) => void;
}

export function EditorPane({ value, darkMode, onChange, onScrollRatio }: EditorPaneProps) {
  return (
    <div className="h-full" data-testid="editor">
      <Editor
        language="markdown"
        value={value}
        theme={darkMode ? 'vs-dark' : 'light'}
        onChange={(next) => onChange(next ?? '')}
        onMount={(editor) => {
          editor.onDidScrollChange((event) => {
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
}
