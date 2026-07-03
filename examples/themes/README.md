# Sample theme export

Export any built-in theme from the web app toolbar (Share icon) to produce
a JSON file in this shape. Import it back with the Palette icon.

The schema is validated by `@seamdoc/themes` (`themeSchema`, version 1).
See `packages/themes/src/builtin.ts` for reference themes such as `minimal`,
`modern`, and `github`.

To generate a fresh export locally:

1. Run `pnpm --filter @seamdoc/web dev`
2. Open the app, click **Export active theme**
3. Save the downloaded JSON beside this README

Imported themes appear in the theme dropdown as "(imported)" and persist in
local storage only.
