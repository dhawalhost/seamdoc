/** Zoom and print-preview controls for the live preview pane. */

import { Minus, Plus, Printer, RefreshCw, ScanEye } from 'lucide-react';
import { formatPreviewZoom, stepPreviewZoom } from '../lib/previewZoom';
import { useAppStore } from '../store';
import { TooltipButton, paneIconClass } from './TooltipButton';

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

      <TooltipButton
        tooltip="Zoom out (minimum 50%)"
        aria-label="Zoom out"
        disabled={previewZoom <= 0.5}
        onClick={() => setPreviewZoom(stepPreviewZoom(previewZoom, 'out'))}
        data-testid="preview-zoom-out"
        className={`${paneIconClass} disabled:opacity-40`}
      >
        <Minus size={16} />
      </TooltipButton>

      <span
        data-testid="preview-zoom-level"
        title="Current preview zoom level"
        className="min-w-12 text-center text-xs tabular-nums text-neutral-700 dark:text-neutral-300"
      >
        {formatPreviewZoom(previewZoom)}
      </span>

      <TooltipButton
        tooltip="Zoom in (maximum 200%)"
        aria-label="Zoom in"
        disabled={previewZoom >= 2}
        onClick={() => setPreviewZoom(stepPreviewZoom(previewZoom, 'in'))}
        data-testid="preview-zoom-in"
        className={`${paneIconClass} disabled:opacity-40`}
      >
        <Plus size={16} />
      </TooltipButton>

      <div className="mx-2 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />

      <TooltipButton
        tooltip="Re-render the preview immediately"
        aria-label="Refresh preview"
        onClick={refreshPreview}
        data-testid="preview-refresh"
        className={paneIconClass}
      >
        <RefreshCw size={16} />
      </TooltipButton>

      <div className="mx-2 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />

      <TooltipButton
        tooltip={
          printPreview
            ? 'Return to split editor and preview'
            : 'Hide the editor and show print-width preview'
        }
        aria-label={printPreview ? 'Exit print preview' : 'Print preview'}
        aria-pressed={printPreview}
        onClick={togglePrintPreview}
        data-testid="print-preview-toggle"
        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium ${
          printPreview
            ? 'bg-blue-600 text-white'
            : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <ScanEye size={14} />
        Print preview
      </TooltipButton>

      <TooltipButton
        tooltip="Open the browser print dialog for the preview"
        aria-label="Print document"
        onClick={() => window.print()}
        data-testid="print-button"
        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Printer size={14} />
        Print
      </TooltipButton>
    </div>
  );
}
