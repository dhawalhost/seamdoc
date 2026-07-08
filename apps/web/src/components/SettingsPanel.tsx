import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PageOrientation, PageSizeName } from '@seamdoc/types';
import { PAGE_SIZES } from '@seamdoc/shared';
import { useAppStore } from '../store';
import { FontFamilySelect } from './FontFamilySelect';
import { TooltipButton } from './TooltipButton';
import { BrandPackSelector } from './BrandPackSelector';
import { StyleMapper } from './StyleMapper';

const fieldClass =
  'w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white';
const labelClass = 'block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1';

export function SettingsPanel() {
  const { t } = useTranslation();
  const {
    settings,
    metadata,
    template,
    updateSettings,
    updateMetadata,
    // updateTemplateMapping,
    setSettingsOpen,
  } = useAppStore();

  const updateMargin = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      updateSettings({ margins: { ...settings.margins, [side]: parsed } });
    }
  };

  return (
    <aside
      data-testid="settings-panel"
      className="flex w-72 flex-col gap-4 overflow-y-auto border-l border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('documentSettings')}
        </h2>
        <TooltipButton
          tooltip={t('closeSettings')}
          aria-label={t('closeSettings')}
          onClick={() => setSettingsOpen(false)}
          placement="top"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={16} />
        </TooltipButton>
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-title">
          {t('documentTitle')}
        </label>
        <input
          id="doc-title"
          data-testid="doc-title"
          className={fieldClass}
          value={metadata.title}
          onChange={(event) => updateMetadata({ title: event.target.value })}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-author">
          {t('author')}
        </label>
        <input
          id="doc-author"
          data-testid="doc-author"
          className={fieldClass}
          value={metadata.author}
          onChange={(event) => updateMetadata({ author: event.target.value })}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-description">
          {t('description')}
        </label>
        <textarea
          id="doc-description"
          data-testid="doc-description"
          className={fieldClass}
          rows={2}
          value={metadata.description}
          onChange={(event) => updateMetadata({ description: event.target.value })}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-keywords">
          {t('keywordsLabel')}
        </label>
        <input
          id="doc-keywords"
          data-testid="doc-keywords"
          className={fieldClass}
          value={metadata.keywords.join(', ')}
          onChange={(event) =>
            updateMetadata({
              keywords: event.target.value
                .split(',')
                .map((keyword) => keyword.trim())
                .filter((keyword) => keyword !== ''),
            })
          }
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-language">
          {t('language')}
        </label>
        <input
          id="doc-language"
          data-testid="doc-language"
          className={fieldClass}
          value={metadata.language}
          onChange={(event) => updateMetadata({ language: event.target.value })}
        />
      </div>

      <hr className="border-neutral-200 dark:border-neutral-800" />
      <BrandPackSelector />
      <hr className="border-neutral-200 dark:border-neutral-800" />

      <div>
        <label className={labelClass} htmlFor="page-size">
          {t('pageSize')}
        </label>
        <select
          id="page-size"
          data-testid="page-size"
          className={fieldClass}
          value={settings.pageSize}
          onChange={(event) => updateSettings({ pageSize: event.target.value as PageSizeName })}
        >
          {(Object.keys(PAGE_SIZES) as PageSizeName[]).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="orientation">
          {t('orientation')}
        </label>
        <select
          id="orientation"
          data-testid="orientation"
          className={fieldClass}
          value={settings.orientation}
          onChange={(event) =>
            updateSettings({ orientation: event.target.value as PageOrientation })
          }
        >
          <option value="portrait">{t('portrait')}</option>
          <option value="landscape">{t('landscape')}</option>
        </select>
      </div>

      <fieldset>
        <legend className={labelClass}>{t('marginsLegend')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <label key={side} className="text-xs text-neutral-500 dark:text-neutral-400">
              {side}
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={settings.margins[side]}
                data-testid={`margin-${side}`}
                onChange={(event) => updateMargin(side, event.target.value)}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="font-family">
          {t('bodyFont')}
        </label>
        <FontFamilySelect
          id="font-family"
          data-testid="font-family"
          className={fieldClass}
          emptyLabel={t('themeDefault')}
          value={settings.fontFamily ?? ''}
          onChange={(family) => updateSettings({ fontFamily: family === '' ? null : family })}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelClass} htmlFor="font-size">
            {t('sizeLabel')}
          </label>
          <input
            id="font-size"
            data-testid="font-size"
            type="number"
            min={6}
            className={fieldClass}
            value={settings.fontSize ?? ''}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              updateSettings({
                fontSize: event.target.value === '' || Number.isNaN(parsed) ? null : parsed,
              });
            }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="line-spacing">
            {t('lineLabel')}
          </label>
          <input
            id="line-spacing"
            data-testid="line-spacing"
            type="number"
            step={0.05}
            min={0.5}
            className={fieldClass}
            value={settings.lineSpacing ?? ''}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              updateSettings({
                lineSpacing: event.target.value === '' || Number.isNaN(parsed) ? null : parsed,
              });
            }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="paragraph-spacing">
            {t('paraLabel')}
          </label>
          <input
            id="paragraph-spacing"
            data-testid="paragraph-spacing"
            type="number"
            min={0}
            className={fieldClass}
            value={settings.paragraphSpacing ?? ''}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              updateSettings({
                paragraphSpacing: event.target.value === '' || Number.isNaN(parsed) ? null : parsed,
              });
            }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="header-text">
          {t('headerText')}
        </label>
        <input
          id="header-text"
          data-testid="header-text"
          className={fieldClass}
          value={settings.header}
          onChange={(event) => updateSettings({ header: event.target.value })}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="footer-text">
          {t('footerText')}
        </label>
        <input
          id="footer-text"
          data-testid="footer-text"
          className={fieldClass}
          value={settings.footer}
          onChange={(event) => updateSettings({ footer: event.target.value })}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 p-3.5 dark:border-neutral-700">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {t('pdfSecurityTitle')}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('pdfSecurityDescription')}
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="pdf-user-password">
            {t('userPassword')}
          </label>
          <input
            id="pdf-user-password"
            type="password"
            placeholder={t('noPasswordSet')}
            className={fieldClass}
            value={settings.pdfSecurity?.userPassword ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              updateSettings({
                pdfSecurity: {
                  ...settings.pdfSecurity,
                  userPassword: val === '' ? null : val,
                },
              });
            }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="pdf-owner-password">
            {t('ownerPassword')}
          </label>
          <input
            id="pdf-owner-password"
            type="password"
            placeholder={t('noOwnerPassword')}
            className={fieldClass}
            value={settings.pdfSecurity?.ownerPassword ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              updateSettings({
                pdfSecurity: {
                  ...settings.pdfSecurity,
                  ownerPassword: val === '' ? null : val,
                },
              });
            }}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          data-testid="page-numbers"
          checked={settings.pageNumbers}
          onChange={(event) => updateSettings({ pageNumbers: event.target.checked })}
        />
        {t('pageNumbers')}
      </label>

      {template !== null && (
        <>
          <hr className="border-neutral-200 dark:border-neutral-800" />
          <StyleMapper />
        </>
      )}
    </aside>
  );
}
