/** AI Layout Critic Panel (Module 17 — AI Review Panel). */

import { AlertTriangle, CheckCircle, Info, Loader2, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { TooltipButton } from './TooltipButton';

export function CriticPanel() {
  const { t } = useTranslation();
  const { criticFindings, criticLoading, runCritic, applyCriticFix, setCriticOpen } = useAppStore();

  return (
    <aside
      data-testid="critic-panel"
      className="flex w-80 flex-col gap-4 overflow-y-auto border-l border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      aria-labelledby="critic-heading"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-neutral-950 dark:text-white">
          <Sparkles size={16} className="text-yellow-500 fill-yellow-500" />
          <h2
            id="critic-heading"
            className="text-sm font-semibold text-neutral-900 dark:text-white"
          >
            {t('aiLayoutCritic')}
          </h2>
        </div>
        <TooltipButton
          tooltip={t('closeAiLayoutCritic')}
          aria-label={t('closeAiLayoutCritic')}
          onClick={() => setCriticOpen(false)}
          placement="top"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={16} />
        </TooltipButton>
      </div>

      <button
        type="button"
        data-testid="run-critic-button"
        disabled={criticLoading}
        onClick={runCritic}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
      >
        {criticLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t('analyzingDocument')}
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {t('runAiCritic')}
          </>
        )}
      </button>

      <div className="flex-1 overflow-y-auto">
        {criticFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-neutral-500">
            <CheckCircle size={32} className="mb-2 text-green-500" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
              {t('noIssuesFound')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 px-4">
              {t('noIssuesDescription')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {criticFindings.map((finding) => {
              const isWarning = finding.severity === 'warning';
              return (
                <div
                  key={finding.id}
                  data-testid={`finding-${finding.id}`}
                  className={`flex flex-col gap-2 rounded-lg border p-3 ${
                    isWarning
                      ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/30 dark:bg-yellow-950/15'
                      : 'border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/15'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isWarning ? (
                      <AlertTriangle
                        size={16}
                        className="mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                      />
                    ) : (
                      <Info
                        size={16}
                        className="mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {isWarning ? t('findingWarning') : t('findingImprovement')}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                        {finding.message}
                      </p>
                    </div>
                  </div>

                  {finding.suggestion && (
                    <div className="rounded bg-white/60 p-2 text-[11px] text-neutral-600 dark:bg-black/20 dark:text-neutral-400">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {t('suggestionLabel')}
                      </span>{' '}
                      {finding.suggestion}
                    </div>
                  )}

                  {finding.id.startsWith('hierarchy-') && (
                    <button
                      type="button"
                      data-testid={`autofix-${finding.id}`}
                      onClick={() => applyCriticFix(finding.id)}
                      className="self-end rounded bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    >
                      {t('autoFix')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
export default CriticPanel;
