/**
 * ExportWizard — a step-by-step modal for choosing export format,
 * customizing settings, and downloading the document.
 *
 * Steps:
 *   1. Choose Format (DOCX, PDF, HTML, PPTX, ODT)
 *   2. Review / tweak key settings
 *   3. Export with progress indicator
 */

import { useState, useCallback } from 'react';
import {
  FileDown,
  FileText,
  FileImage,
  FileCode,
  Presentation,
  BookOpen,
  Book,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { ExportFormat } from '@seamdoc/types';
import { useAppStore, resolveActiveTheme } from '../store';
import { downloadDocument } from '../lib/export';

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  extension: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'docx',
    label: 'Microsoft Word',
    description: 'Best for editing in Word or Google Docs. Preserves styles and heading structure.',
    extension: '.docx',
    icon: FileText,
    color: '#2B5CE7',
  },
  {
    id: 'pdf',
    label: 'PDF Document',
    description: 'Universal format for sharing. Perfectly preserves layout and typography.',
    extension: '.pdf',
    icon: FileImage,
    color: '#E53E3E',
  },
  {
    id: 'html',
    label: 'HTML Page',
    description: 'Self-contained web page. Great for publishing to the web or email.',
    extension: '.html',
    icon: FileCode,
    color: '#DD6B20',
  },
  {
    id: 'pptx',
    label: 'PowerPoint',
    description: 'One slide per page. Useful for document-driven presentations.',
    extension: '.pptx',
    icon: Presentation,
    color: '#D53F8C',
  },
  {
    id: 'odt',
    label: 'OpenDocument Text',
    description: 'Open standard format. Compatible with LibreOffice and Google Docs.',
    extension: '.odt',
    icon: BookOpen,
    color: '#319795',
  },
  {
    id: 'epub',
    label: 'EPUB Book',
    description: 'Reflowable e-book format. Perfect for e-readers and mobile devices.',
    extension: '.epub',
    icon: Book,
    color: '#805AD5',
  },
];

type WizardStep = 'format' | 'settings' | 'exporting' | 'done' | 'error';

interface ExportWizardProps {
  onClose: () => void;
}

export function ExportWizard({ onClose }: ExportWizardProps) {
  const { markdown, themeId, customThemes, settings, metadata, template } = useAppStore();
  const [step, setStep] = useState<WizardStep>('format');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('docx');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExport = useCallback(async () => {
    setStep('exporting');
    setErrorMessage('');
    try {
      await downloadDocument(
        selectedFormat,
        markdown,
        resolveActiveTheme(themeId, customThemes),
        settings,
        metadata,
        template,
      );
      setStep('done');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected error during export.');
      setStep('error');
    }
  }, [selectedFormat, markdown, themeId, customThemes, settings, metadata, template]);

  const selectedFormatOption = FORMAT_OPTIONS.find((f) => f.id === selectedFormat)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-wizard-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <FileDown size={20} className="text-blue-600" />
            <h2
              id="export-wizard-title"
              className="text-lg font-semibold text-neutral-900 dark:text-white"
            >
              Export Document
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export wizard"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {/* Step: Format Selection */}
          {step === 'format' && (
            <div>
              <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                Choose the output format for your document.
              </p>
              <div className="grid gap-3">
                {FORMAT_OPTIONS.map((fmt) => {
                  const Icon = fmt.icon;
                  const isSelected = fmt.id === selectedFormat;
                  return (
                    <button
                      key={fmt.id}
                      id={`export-format-${fmt.id}`}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: fmt.color + '18', color: fmt.color }}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {fmt.label}
                          </span>
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            {fmt.extension}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                          {fmt.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto mt-1 flex-shrink-0">
                          <div className="h-4 w-4 rounded-full bg-blue-500" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Settings Review */}
          {step === 'settings' && (
            <div>
              <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                Review your export settings before downloading.
              </p>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {[
                      [
                        'Format',
                        `${selectedFormatOption.label} (${selectedFormatOption.extension})`,
                      ],
                      ['Page size', settings.pageSize ?? 'A4'],
                      ['Orientation', settings.orientation ?? 'portrait'],
                      ['Font', `${settings.fontFamily ?? 'Default'} ${settings.fontSize ?? 12}pt`],
                      ['Theme', typeof themeId === 'string' ? themeId : 'Custom'],
                      ['Title', metadata.title || '(none)'],
                      ['Author', metadata.author || '(none)'],
                    ].map(([key, value]) => (
                      <tr key={key}>
                        <td className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">
                          {key}
                        </td>
                        <td className="py-2 text-neutral-900 dark:text-white">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
                To change these settings, close this dialog and use the{' '}
                <span className="font-medium">Document Settings</span> panel.
              </p>
            </div>
          )}

          {/* Step: Exporting */}
          {step === 'exporting' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 size={40} className="animate-spin text-blue-500" />
              <p className="mt-4 text-base font-medium text-neutral-700 dark:text-neutral-300">
                Generating your {selectedFormatOption.label}…
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                This may take a moment for large documents.
              </p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 size={40} className="text-green-500" />
              <p className="mt-4 text-base font-medium text-neutral-700 dark:text-neutral-300">
                Your {selectedFormatOption.label} is ready!
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                Check your Downloads folder for the exported file.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-lg bg-green-500 px-6 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                Done
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-10 text-center">
              <AlertCircle size={40} className="text-red-500" />
              <p className="mt-4 text-base font-medium text-neutral-700 dark:text-neutral-300">
                Export failed
              </p>
              <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
                {errorMessage}
              </p>
              <button
                onClick={() => setStep('settings')}
                className="mt-6 rounded-lg border border-red-300 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {(step === 'format' || step === 'settings') && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <button
              onClick={step === 'format' ? onClose : () => setStep('format')}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <ChevronLeft size={16} />
              {step === 'format' ? 'Cancel' : 'Back'}
            </button>
            <div className="flex items-center gap-2">
              {/* Step indicators */}
              <span
                className={`h-2 w-2 rounded-full ${step === 'format' ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
              />
              <span
                className={`h-2 w-2 rounded-full ${step === 'settings' ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
              />
            </div>
            <button
              onClick={step === 'format' ? () => setStep('settings') : handleExport}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {step === 'format' ? (
                <>
                  Next <ChevronRight size={16} />
                </>
              ) : (
                <>
                  <FileDown size={16} /> Export
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
