import type { MappableNode } from '@seamdoc/templates';
import { useAppStore } from '../store';

const MAPPABLE_LABELS: Record<MappableNode, string> = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  paragraph: 'Body Text',
  quote: 'Block Quote',
  code: 'Code Block',
  table: 'Table',
};

export function StyleMapper() {
  const { template, updateTemplateMapping } = useAppStore();

  if (template === null) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Upload a Word template (.docx) in the toolbar to configure visual style mappings.
      </div>
    );
  }

  const paragraphStyles = template.styles.filter((s) => s.type === 'paragraph');
  const tableStyles = template.styles.filter((s) => s.type === 'table');

  return (
    <div className="space-y-4" data-testid="template-mapping">
      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Word Style Mapper
        </h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Map SeamDoc semantic elements to custom style IDs defined in your template.
        </p>
      </div>

      <div className="space-y-3">
        {(Object.keys(MAPPABLE_LABELS) as MappableNode[]).map((node) => {
          const activeStyleId = template.mapping[node] ?? '';
          const stylesList = node === 'table' ? tableStyles : paragraphStyles;

          return (
            <div key={node} className="flex items-center justify-between gap-4">
              <label
                htmlFor={`map-style-${node}`}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                {MAPPABLE_LABELS[node]}
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
                <option value="">Default theme style</option>
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
