import { BRAND_PACKS } from '@seamdoc/shared';
import { useAppStore } from '../store';

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
