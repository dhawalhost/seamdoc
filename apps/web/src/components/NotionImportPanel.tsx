import { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { importNotion } from '@seamdoc/importers';
import { sdmToMarkdown } from '../lib/sdmToMarkdown';

interface NotionImportPanelProps {
  readonly onClose: () => void;
  readonly onImport: (markdown: string) => void;
}

export function NotionImportPanel({ onClose, onImport }: NotionImportPanelProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    if (!jsonText.trim()) {
      setError('Please paste Notion block JSON first.');
      return;
    }

    try {
      let parsed = JSON.parse(jsonText);

      // If it's wrapped in a response object (e.g. { results: [...] } or { children: [...] })
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (Array.isArray(parsed.results)) {
          parsed = parsed.results;
        } else if (Array.isArray(parsed.children)) {
          parsed = parsed.children;
        } else {
          setError(
            'JSON must be a list of Notion blocks, or an object containing a "results" or "children" list.',
          );
          return;
        }
      }

      if (!Array.isArray(parsed)) {
        setError('Expected an array of Notion blocks.');
        return;
      }

      // Convert to SDM Document
      const sdmDoc = importNotion(parsed);

      // Convert to Markdown
      const markdown = sdmToMarkdown(sdmDoc);

      if (!markdown.trim()) {
        setError('No importable content found in the provided Notion blocks.');
        return;
      }

      onImport(markdown);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notion-import-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-blue-600" />
            <h2
              id="notion-import-title"
              className="text-lg font-semibold text-neutral-900 dark:text-white"
            >
              Import from Notion
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Notion import"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
            Paste a list of Notion block objects or a raw JSON response from the Notion API (e.g.
            results list of block children).
          </p>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='[\n  {\n    "type": "paragraph",\n    "paragraph": {\n      "rich_text": [{ "type": "text", "text": { "content": "Hello Notion!" } }]\n    }\n  }\n]'
            data-testid="notion-import-textarea"
            className="h-64 w-full rounded-lg border border-neutral-300 p-3 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          />

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
export default NotionImportPanel;
