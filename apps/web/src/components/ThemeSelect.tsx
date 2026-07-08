import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search, Check, Palette } from 'lucide-react';
import { useAppStore } from '../store';
import { builtinThemes, withThemeDefaults, type Theme } from '@seamdoc/themes';

export function ThemeSelect() {
  const { t } = useTranslation();
  const { themeId, customThemes, setThemeId } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search query when dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Combine custom (imported) themes and built-in themes
  const allThemes: Theme[] = [
    ...customThemes.map((theme) => withThemeDefaults(theme)),
    ...builtinThemes.map((theme) => withThemeDefaults(theme)),
  ];

  // Filter themes based on search query
  const filteredThemes = allThemes.filter((theme) => {
    const query = searchQuery.toLowerCase();
    const name = theme.metadata.name.toLowerCase();
    const description = (theme.metadata.description || '').toLowerCase();
    const id = theme.metadata.id.toLowerCase();
    const headingFont = theme.typography.heading.toLowerCase();
    const bodyFont = theme.typography.body.toLowerCase();

    return (
      name.includes(query) ||
      description.includes(query) ||
      id.includes(query) ||
      headingFont.includes(query) ||
      bodyFont.includes(query)
    );
  });

  // Find the currently selected theme metadata
  const currentTheme = allThemes.find((theme) => theme.metadata.id === themeId) || allThemes[0];

  return (
    <div
      className="relative inline-block text-left"
      ref={containerRef}
      data-testid="theme-select-container"
    >
      {/* Selector Trigger Button */}
      <button
        type="button"
        id="theme-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={t('clickToChangeTheme')}
        className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-all hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700/80"
      >
        <Palette size={16} className="text-neutral-500 dark:text-neutral-400" />
        <span className="truncate max-w-[120px]">{currentTheme?.metadata.name || themeId}</span>

        {/* Current Theme Swatch preview directly in the button */}
        {currentTheme && (
          <div className="flex -space-x-1 items-center">
            <span
              className="h-3 w-3 rounded-full border border-white dark:border-neutral-800"
              style={{ backgroundColor: currentTheme.colors.primary }}
            />
            <span
              className="h-3 w-3 rounded-full border border-white dark:border-neutral-800"
              style={{ backgroundColor: currentTheme.colors.accent }}
            />
          </div>
        )}
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Selector Popover */}
      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 w-[420px] origin-top-left rounded-xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          role="listbox"
          aria-labelledby="theme-select-trigger"
        >
          {/* Search bar header */}
          <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-3.5 py-2.5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 rounded-t-xl">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                autoFocus
                placeholder={t('searchThemes')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-blue-500 dark:focus:bg-neutral-900"
              />
            </div>
          </div>

          {/* Theme Lists (Scrollable) */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-2">
            {filteredThemes.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                {t('noThemesFound')}
              </div>
            ) : (
              filteredThemes.map((theme) => {
                const isSelected = theme.metadata.id === themeId;
                const isCustom = customThemes.some((ct) => ct.metadata.id === theme.metadata.id);

                return (
                  <button
                    key={theme.metadata.id}
                    onClick={() => {
                      setThemeId(theme.metadata.id);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    {/* Visual Document Mockup Sheet */}
                    <div
                      className="relative h-[100px] w-[76px] flex-shrink-0 rounded border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between p-1.5 dark:border-neutral-700"
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      {/* Mini Branding Header Bar */}
                      <div
                        className="w-full h-2 rounded-sm"
                        style={{
                          backgroundColor: theme.branding?.headerBackground || theme.colors.primary,
                        }}
                      />

                      {/* Mini Page Content */}
                      <div className="flex-1 mt-1.5 flex flex-col gap-1 justify-start">
                        {/* Heading Line */}
                        <div
                          className="text-[8px] font-bold leading-tight truncate"
                          style={{
                            fontFamily: theme.typography.heading,
                            color: theme.headings.h1.color || theme.colors.primary,
                          }}
                        >
                          {t('headingPreviewText')}
                        </div>

                        {/* Dummy Paragraph text bars */}
                        <div className="flex flex-col gap-0.5">
                          <div className="h-1 w-full rounded-sm bg-neutral-200 dark:bg-neutral-700" />
                          <div className="h-1 w-[80%] rounded-sm bg-neutral-200 dark:bg-neutral-700" />
                          <div className="h-1 w-[90%] rounded-sm bg-neutral-200 dark:bg-neutral-700" />
                        </div>
                      </div>

                      {/* Swatch dots at the very bottom */}
                      <div className="flex gap-0.5 justify-start mt-1">
                        <span
                          className="h-2 w-2 rounded-full border border-white dark:border-neutral-800"
                          title="Primary color"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <span
                          className="h-2 w-2 rounded-full border border-white dark:border-neutral-800"
                          title="Accent color"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                        <span
                          className="h-2 w-2 rounded-full border border-white dark:border-neutral-800"
                          title="Code Background color"
                          style={{ backgroundColor: theme.colors.codeBackground }}
                        />
                      </div>
                    </div>

                    {/* Metadata & Typography details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                            {theme.metadata.name}
                          </span>
                          {isCustom && (
                            <span className="rounded bg-orange-100 px-1 py-0.5 text-[9px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                              Imported
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {theme.metadata.description}
                        </p>
                      </div>

                      {/* Font pair summary block */}
                      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                        <span
                          className="truncate"
                          title={`Heading font: ${theme.typography.heading}`}
                        >
                          H: {theme.typography.heading}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="truncate" title={`Body font: ${theme.typography.body}`}>
                          B: {theme.typography.body}
                        </span>
                      </div>
                    </div>

                    {/* Selected Checkmark overlay */}
                    {isSelected && (
                      <div className="flex-shrink-0 self-center p-1 rounded-full bg-blue-500 text-white shadow-sm dark:bg-blue-600">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default ThemeSelect;
