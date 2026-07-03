/** Zoom and print-preview controls for the live preview pane. */

import { Minus, Plus, Printer, RefreshCw, ScanEye } from 'lucide-react';
import { formatPreviewZoom, stepPreviewZoom } from '../lib/previewZoom';
import { useAppStore } from '../store';

export function PreviewToolbar() {
  const { previewZoom, printPreview, setPreviewZoom, togglePrintPreview, refreshPreview } =
    useAppStore();

  return (
    <div
      className="flex items-center gap-1 border-b border-neutral-200 bg-neutral-100 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
      data-no-print
      data-testid="preview-toolbar"
    >
      <span className="mr-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
        Preview
      </span>

      <button
        type="button"
        title="Zoom out"
        aria-label="Zoom out"
        data-testid="preview-zoom-out"
        disabled={previewZoom <= 0.5}
        onClick={() => setPreviewZoom(stepPreviewZoom(previewZoom, 'out'))}
        className="rounded p-1 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Minus size={16} />
      </button>

      <span
        data-testid="preview-zoom-level"
        className="min-w-12 text-center text-xs tabular-nums text-neutral-700 dark:text-neutral-300"
      >
        {formatPreviewZoom(previewZoom)}
      </span>

      <button
        type="button"
        title="Zoom in"
        aria-label="Zoom in"
        data-testid="preview-zoom-in"
        disabled={previewZoom >= 2}
        onClick={() => setPreviewZoom(stepPreviewZoom(previewZoom, 'in'))}
        className="rounded p-1 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Plus size={16} />
      </button>

      <div className="mx-2 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />

      <button
        type="button"
        title="Refresh preview"
        aria-label="Refresh preview"
        data-testid="preview-refresh"
        onClick={refreshPreview}
        className="rounded p-1 text-neutral-600 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <RefreshCw size={16} />
      </button>

      <div className="mx-2 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />

      <button
        type="button"
        title={printPreview ? 'Exit print preview' : 'Print preview'}
        aria-label={printPreview ? 'Exit print preview' : 'Print preview'}
        aria-pressed={printPreview}
        data-testid="print-preview-toggle"
        onClick={togglePrintPreview}
        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
          printPreview
            ? 'bg-blue-600 text-white'
            : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <ScanEye size={14} />
        Print preview
      </button>

      <button
        type="button"
        title="Print document"
        aria-label="Print document"
        data-testid="print-button"
        onClick={() => window.print()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Printer size={14} />
        Print
      </button>
    </div>
  );
}
