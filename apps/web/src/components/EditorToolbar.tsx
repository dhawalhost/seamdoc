/** Editor-local controls: find, replace, fullscreen. */

import { Maximize2, Replace, Search } from 'lucide-react';
import { useAppStore } from '../store';

interface EditorToolbarProps {
  onFind: () => void;
  onReplace: () => void;
}

export function EditorToolbar({ onFind, onReplace }: EditorToolbarProps) {
  const { editorFullscreen, toggleEditorFullscreen } = useAppStore();

  return (
    <div
      className="flex items-center gap-1 border-b border-neutral-200 bg-neutral-100 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
      data-no-print
      data-testid="editor-toolbar"
    >
      <span className="mr-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">Editor</span>

      <button
        type="button"
        title="Find (Ctrl/Cmd+F)"
        aria-label="Find"
        data-testid="editor-find"
        onClick={onFind}
        className="rounded p-1 text-neutral-600 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Search size={16} />
      </button>

      <button
        type="button"
        title="Replace (Ctrl/Cmd+H)"
        aria-label="Replace"
        data-testid="editor-replace"
        onClick={onReplace}
        className="rounded p-1 text-neutral-600 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Replace size={16} />
      </button>

      <div className="mx-2 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />

      <button
        type="button"
        title={editorFullscreen ? 'Exit fullscreen editing' : 'Fullscreen editing'}
        aria-label={editorFullscreen ? 'Exit fullscreen editing' : 'Fullscreen editing'}
        aria-pressed={editorFullscreen}
        data-testid="editor-fullscreen-toggle"
        onClick={toggleEditorFullscreen}
        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
          editorFullscreen
            ? 'bg-blue-600 text-white'
            : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <Maximize2 size={14} />
        Fullscreen
      </button>
    </div>
  );
}
