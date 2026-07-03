/** Document settings: page size, orientation, margins, header/footer, page numbers. */

import { X } from 'lucide-react';
import type { PageOrientation, PageSizeName, TemplateMappableNode } from '@seamdoc/types';
import { PAGE_SIZES } from '@seamdoc/shared';
import { useAppStore } from '../store';

const fieldClass =
  'w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white';
const labelClass = 'block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1';

const MAPPABLE_NODES: readonly { node: TemplateMappableNode; label: string }[] = [
  { node: 'h1', label: 'Heading 1' },
  { node: 'h2', label: 'Heading 2' },
  { node: 'h3', label: 'Heading 3' },
  { node: 'paragraph', label: 'Paragraph' },
  { node: 'quote', label: 'Quote' },
  { node: 'code', label: 'Code block' },
  { node: 'table', label: 'Table' },
];

export function SettingsPanel() {
  const {
    settings,
    metadata,
    template,
    updateSettings,
    updateMetadata,
    updateTemplateMapping,
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
          Document settings
        </h2>
        <button
          type="button"
          onClick={() => setSettingsOpen(false)}
          aria-label="Close settings"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={16} />
        </button>
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-title">
          Document title
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
          Author
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
        <label className={labelClass} htmlFor="page-size">
          Page size
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
          Orientation
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
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>

      <fieldset>
        <legend className={labelClass}>Margins (pt)</legend>
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
          Body font (blank = theme default)
        </label>
        <input
          id="font-family"
          data-testid="font-family"
          className={fieldClass}
          placeholder="e.g. Georgia"
          value={settings.fontFamily ?? ''}
          onChange={(event) =>
            updateSettings({ fontFamily: event.target.value === '' ? null : event.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelClass} htmlFor="font-size">
            Size (pt)
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
            Line
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
            Para (pt)
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
          Header text
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
          Footer text
        </label>
        <input
          id="footer-text"
          data-testid="footer-text"
          className={fieldClass}
          value={settings.footer}
          onChange={(event) => updateSettings({ footer: event.target.value })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          data-testid="page-numbers"
          checked={settings.pageNumbers}
          onChange={(event) => updateSettings({ pageNumbers: event.target.checked })}
        />
        Page numbers
      </label>

      {template !== null && (
        <fieldset data-testid="template-mapping">
          <legend className={labelClass}>Template style mapping — {template.metadata.name}</legend>
          <div className="flex flex-col gap-2">
            {MAPPABLE_NODES.map(({ node, label }) => (
              <label key={node} className="text-xs text-neutral-500 dark:text-neutral-400">
                {label}
                <select
                  className={fieldClass}
                  data-testid={`mapping-${node}`}
                  value={template.mapping[node] ?? ''}
                  onChange={(event) =>
                    updateTemplateMapping({
                      [node]: event.target.value === '' ? undefined : event.target.value,
                    })
                  }
                >
                  <option value="">Theme default</option>
                  {template.styles
                    .filter((style) => style.type === (node === 'table' ? 'table' : 'paragraph'))
                    .map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </aside>
  );
}
