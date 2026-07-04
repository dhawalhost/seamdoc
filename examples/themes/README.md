# Sample theme export

See **[User guide — Creating a theme](../../docs/01-product/user-guide.md#creating-a-theme-visual-creator)** for the full walkthrough (visual creator or JSON).

Export any built-in theme from the web app toolbar (Share icon) to produce
a JSON file in this shape. Import it back with the Palette icon.

The schema is validated by `@seamdoc/themes` (`themeSchema`, version 1).
See `packages/themes/src/builtin.ts` for all 37 built-in themes: core set,
Google Docs–style templates (`spectrum`, `coral`, `academic`, …), and Microsoft
Office / Word–style templates (`office`, `facet`, `whitepaper`, `resume`, …).

To generate a fresh export locally:

1. Run `pnpm --filter @seamdoc/web dev`
2. Open the app, click **Export active theme**
3. Save the downloaded JSON beside this README

Imported themes appear in the theme dropdown as "(imported)" and persist in
local storage only.
