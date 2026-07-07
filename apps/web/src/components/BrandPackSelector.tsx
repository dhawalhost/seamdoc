import type { BrandPack } from '@seamdoc/types';
import { useAppStore } from '../store';

const BRAND_PACKS: readonly BrandPack[] = [
  {
    id: 'acme',
    name: 'Acme Corporate',
    primaryColor: '#1E3A8A',
    secondaryColor: '#3B82F6',
    fontFamilies: ['Inter', 'sans-serif'],
    headerText: 'ACME CORP — CONFIDENTIAL',
    footerText: 'Internal Use Only',
  },
  {
    id: 'novatech',
    name: 'Nova Labs',
    primaryColor: '#7C3AED',
    secondaryColor: '#06B6D4',
    fontFamilies: ['Outfit', 'sans-serif'],
    headerText: 'NOVA LABS RESEARCH',
    footerText: 'Status: Draft Spec',
  },
  {
    id: 'ekobios',
    name: 'Eko Bio-sciences',
    primaryColor: '#064E3B',
    secondaryColor: '#10B981',
    fontFamilies: ['Roboto', 'serif'],
    headerText: 'EKO BIOMATERIAL REPORT',
    footerText: 'Green Future Initiative',
  },
];

export function BrandPackSelector() {
  const { settings, updateSettings } = useAppStore();

  const handleSelectPack = (packId: string | null) => {
    if (packId === null) {
      updateSettings({
        activeBrandPackId: null,
        fontFamily: null,
        header: '',
        footer: '',
      });
      return;
    }

    const pack = BRAND_PACKS.find((p) => p.id === packId);
    if (pack) {
      updateSettings({
        activeBrandPackId: packId,
        fontFamily: pack.fontFamilies[0] ?? null,
        header: pack.headerText ?? '',
        footer: pack.footerText ?? '',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Enterprise Brand Packs
        </h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Apply preconfigured organization branding: color palettes, typography, and page
          headers/footers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSelectPack(null)}
          className={`rounded-xl border p-3 text-left transition-all ${
            settings.activeBrandPackId === null || settings.activeBrandPackId === undefined
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
          }`}
        >
          <span className="block text-xs font-semibold text-neutral-950 dark:text-white">None</span>
          <span className="block text-[10px] text-neutral-500">Use active theme styles</span>
        </button>

        {BRAND_PACKS.map((pack) => {
          const isSelected = settings.activeBrandPackId === pack.id;
          return (
            <button
              key={pack.id}
              onClick={() => handleSelectPack(pack.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <span className="block text-xs font-semibold text-neutral-950 dark:text-white">
                {pack.name}
              </span>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-white dark:border-neutral-800"
                  style={{ backgroundColor: pack.primaryColor }}
                />
                <span
                  className="h-3.5 w-3.5 rounded-full border border-white dark:border-neutral-800"
                  style={{ backgroundColor: pack.secondaryColor }}
                />
                <span className="text-[10px] font-medium text-neutral-500">
                  {pack.fontFamilies[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default BrandPackSelector;
