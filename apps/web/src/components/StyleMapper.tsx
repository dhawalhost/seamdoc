import type { MappableNode, StyleMapping } from '@seamdoc/templates';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

function getMappableLabel(node: MappableNode, t: (key: string) => string): string {
  switch (node) {
    case 'h1':
      return t('heading1');
    case 'h2':
      return t('heading2');
    case 'h3':
      return t('heading3');
    case 'h4':
      return t('heading4');
    case 'h5':
      return t('heading5');
    case 'h6':
      return t('heading6');
    case 'paragraph':
      return t('bodyText');
    case 'quote':
      return t('blockQuote');
    case 'code':
      return t('codeBlock');
    case 'table':
      return t('table');
    default:
      return '';
  }
}

function getMappingValue(mapping: StyleMapping, node: MappableNode): string | undefined {
  switch (node) {
    case 'h1':
      return mapping.h1;
    case 'h2':
      return mapping.h2;
    case 'h3':
      return mapping.h3;
    case 'h4':
      return mapping.h4;
    case 'h5':
      return mapping.h5;
    case 'h6':
      return mapping.h6;
    case 'paragraph':
      return mapping.paragraph;
    case 'quote':
      return mapping.quote;
    case 'code':
      return mapping.code;
    case 'table':
      return mapping.table;
    default:
      return undefined;
  }
}

const NODES_LIST: readonly MappableNode[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'paragraph',
  'quote',
  'code',
  'table',
];

export function StyleMapper() {
  const { t } = useTranslation();
  const { template, updateTemplateMapping } = useAppStore();

  if (template === null) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {t('Upload a Word template (.docx) in the toolbar to configure visual style mappings.')}
      </div>
    );
  }

  const paragraphStyles = template.styles.filter((s) => s.type === 'paragraph');
  const tableStyles = template.styles.filter((s) => s.type === 'table');

  return (
    <div className="space-y-4" data-testid="template-mapping">
      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('styleMappingTitle')}
        </h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('styleMapperDescription')}
        </p>
      </div>

      <div className="space-y-3">
        {NODES_LIST.map((node) => {
          const activeStyleId = getMappingValue(template.mapping, node) ?? '';
          const stylesList = node === 'table' ? tableStyles : paragraphStyles;

          return (
            <div key={node} className="flex items-center justify-between gap-4">
              <label
                htmlFor={`map-style-${node}`}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                {getMappableLabel(node, t)}
              </label>
              <select
                id={`map-style-${node}`}
                data-testid={`mapping-${node}`}
                value={activeStyleId}
                onChange={(e) => {
                  const val = e.target.value;
                  const newMapping = { ...template.mapping, [node]: val === '' ? undefined : val };
                  updateTemplateMapping(newMapping);
                }}
                className="w-48 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="">{t('themeDefault')}</option>
                {stylesList.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name} ({style.id})
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default StyleMapper;
