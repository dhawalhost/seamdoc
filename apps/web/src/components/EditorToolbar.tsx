/** Editor-local controls: find, replace, fullscreen. */

import { Maximize2, Replace, Search } from 'lucide-react';
import { useAppStore } from '../store';
import { TooltipButton, paneIconClass } from './TooltipButton';

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
      <span className="mr-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
        Editor
      </span>

      <TooltipButton
        tooltip="Find text in the document (Ctrl+F / Cmd+F)"
        aria-label="Find"
        onClick={onFind}
        data-testid="editor-find"
        className={paneIconClass}
      >
        <Search size={16} />
      </TooltipButton>

      <TooltipButton
        tooltip="Find and replace text (Ctrl+H / Cmd+H)"
        aria-label="Replace"
        onClick={onReplace}
        data-testid="editor-replace"
        className={paneIconClass}
      >
        <Replace size={16} />
      </TooltipButton>

      <div className="mx-2 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />

      <TooltipButton
        tooltip={
          editorFullscreen
            ? 'Show the preview pane again'
            : 'Hide preview and use the full width for editing'
        }
        aria-label={editorFullscreen ? 'Exit fullscreen editing' : 'Fullscreen editing'}
        aria-pressed={editorFullscreen}
        onClick={toggleEditorFullscreen}
        data-testid="editor-fullscreen-toggle"
        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium ${
          editorFullscreen
            ? 'bg-blue-600 text-white'
            : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <Maximize2 size={14} />
        Fullscreen
      </TooltipButton>
    </div>
  );
}
