/**
 * Local History & Revisions panel.
 * Displays local drafts saved in IndexedDB, allowing users to restore older versions.
 */

import { Calendar, Database, FileText, History, RotateCcw, Trash2, X } from 'lucide-react';
import { useAppStore } from '../store';
import { TooltipButton } from './TooltipButton';

export function HistoryPanel() {
  const {
    revisions,
    setHistoryOpen,
    restoreRevision,
    deleteRevisionFromStore,
    clearAllRevisionsFromStore,
  } = useAppStore();

  const handleRestore = (rev: (typeof revisions)[0]) => {
    if (
      window.confirm(
        'Are you sure you want to restore this revision? Your current editor state will be replaced.',
      )
    ) {
      restoreRevision(rev);
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm('Are you sure you want to clear all revision history? This cannot be undone.')
    ) {
      void clearAllRevisionsFromStore();
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <aside
      data-testid="history-panel"
      className="flex w-80 flex-col gap-4 overflow-y-auto border-l border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      aria-labelledby="history-heading"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-neutral-950 dark:text-white">
          <History size={16} className="text-blue-600 dark:text-blue-400" />
          <h2
            id="history-heading"
            className="text-sm font-semibold text-neutral-900 dark:text-white"
          >
            Local History
          </h2>
        </div>
        <TooltipButton
          tooltip="Close Local History"
          aria-label="Close Local History"
          onClick={() => setHistoryOpen(false)}
          placement="top"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={16} />
        </TooltipButton>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
        Revisions are automatically captured as you type. All draft history is stored locally on
        your device.
      </p>

      <div className="flex-1 overflow-y-auto min-h-0">
        {revisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
            <Database size={32} className="mb-2 text-neutral-400 dark:text-neutral-600" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
              No Revisions Found
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 px-4">
              Type inside the editor to trigger automatic drafts.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                data-testid={`revision-${rev.id}`}
                className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 hover:border-blue-300 dark:border-neutral-800 dark:bg-neutral-950/20 dark:hover:border-blue-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {rev.title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-1">
                      <Calendar size={10} />
                      <span className="truncate">{formatTime(rev.timestamp)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Delete this revision"
                    onClick={() => rev.id !== undefined && void deleteRevisionFromStore(rev.id)}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-neutral-100 dark:border-neutral-850">
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <FileText size={10} />
                    <span>{rev.wordCount} words</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(rev)}
                    className="flex items-center gap-1 rounded bg-neutral-950 px-2 py-1 text-[10px] font-medium text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  >
                    <RotateCcw size={10} />
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {revisions.length > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-red-200 bg-red-50/50 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100/50 dark:border-red-900/30 dark:bg-red-950/10 dark:hover:bg-red-950/20"
        >
          <Trash2 size={12} />
          Clear All History
        </button>
      )}
    </aside>
  );
}
export default HistoryPanel;
