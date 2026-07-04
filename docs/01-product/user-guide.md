# Seamdoc user guide

This guide explains the web app controls, how to import themes and Word
templates, and what each file must contain.

## Quick start

1. Write or paste Markdown in the **editor** (left pane).
2. Pick a **theme** from the toolbar dropdown.
3. Adjust **document settings** if needed (page size, headers, metadata).
4. Click **Export DOCX** or **Export PDF**.

You can also **drag and drop** a single `.md` file anywhere on the app to open
it. Hover any toolbar icon for a short description of what it does.

Everything runs in your browser; your document stays on your device unless
you download an export.

## Toolbar icons (main bar)

| Icon | Name | What it does |
| :--- | :--- | :--- |
| **+** (file plus) | New document | Clears the editor and starts a blank document. Uses your default theme from app preferences. |
| **Folder** | Open file | Opens a `.md` or `.markdown` file from disk. |
| **Theme dropdown** | Theme selector | Switches the active theme for preview and export. Built-in themes plus any you imported (shown as “imported”). |
| **Wand** | Theme creator | Opens the visual theme creator (colors, fonts, logo/header chrome, live preview). Use **Save**, **Apply**, or **Download JSON**. |
| **Palette** | Import theme | Uploads a theme JSON file. Invalid files show an error next to the toolbar. |
| **Share** | Export theme | Downloads the **currently selected** theme as JSON (built-in or imported). Use this as a starting point for custom themes. |
| **Layout template** | Import template | Uploads a Word `.docx` template. Styles are extracted for DOCX export. |
| **×** on template chip | Remove template | Clears the active template and restores page settings the template had overridden. |
| **Gear** | Document settings | Opens the document settings panel (metadata, page layout, template mapping). |
| **Sliders** | App preferences | Opens app-level preferences (dark mode, default theme, default export format). |
| **Moon / Sun** | Dark mode | Toggles the editor chrome between light and dark. |
| **Export PDF / DOCX** | Export | Downloads the current document. The solid blue button matches your default export format in app preferences. |

**Stats** (right side of toolbar): word count, line count, and character count for the current Markdown.

## Editor toolbar

| Icon | What it does |
| :--- | :--- |
| **Search** | Opens Monaco find (`Ctrl+F` / `Cmd+F`). |
| **Replace** | Opens find-and-replace (`Ctrl+H` / `Cmd+H`). |
| **Fullscreen** | Hides the preview pane so the editor uses the full width. |

## Preview toolbar

| Icon | What it does |
| :--- | :--- |
| **− / +** | Zoom the preview between 50% and 200%. |
| **Refresh** | Forces the preview to re-render immediately (bypasses the usual typing debounce). |
| **Print preview** | Hides the editor and shows only the preview, full width. |
| **Print** | Opens the browser print dialog (print styles hide toolbars). |

Scrolling in the editor or preview **syncs** the other pane when both are visible.

## Document settings panel

Opened with the **gear** icon. Controls apply to the current document and affect
both preview and export.

### Metadata

| Field | Used for |
| :--- | :--- |
| Document title | Export filename (`My Report.docx`) and DOCX core properties. |
| Author | DOCX metadata. |
| Description | DOCX metadata. |
| Keywords | Comma-separated; stored in DOCX metadata. |
| Language | Document language code (e.g. `en-US`) in export metadata. |

### Page layout

| Field | Used for |
| :--- | :--- |
| Page size | A4, Letter, Legal, etc. |
| Orientation | Portrait or landscape. |
| Margins | Top, right, bottom, left in points. |
| Body font / size / line spacing / paragraph spacing | Overrides theme defaults when set (blank = theme default). |
| Header / footer text | Shown on every preview page and in exports. |
| Page numbers | Adds page numbers to the footer in preview and export. |

### Template style mapping

When a Word template is loaded, this section lists each semantic node (Heading
1–6, paragraph, quote, code block, table) and lets you pick which Word style
from the template applies. **Theme default** leaves that node styled by the
active theme instead of the template.

## App preferences panel

Opened with the **sliders** icon. Saved in browser local storage.

| Setting | What it does |
| :--- | :--- |
| Dark mode | Same as the moon/sun toolbar toggle. |
| High contrast | Stronger contrast and borders across the UI. |
| Default theme | Theme applied when you click **New document**. |
| Default export format | Which export button appears solid blue (DOCX or PDF). |

---

## Creating a theme (visual creator)

Themes control fonts, colors, spacing, and page chrome for preview and export.
They do not change your Markdown content.

### Theme creator portal (recommended)

1. Select a built-in theme close to what you want (optional).
2. Click **Theme creator** (wand icon) in the toolbar.
3. Edit identity, **page chrome & logo**, colors, typography, headings, and more.
4. Watch the **live preview** on the right update as you change controls.
5. Use the actions in the creator header:

| Action | What it does |
| :--- | :--- |
| **Save** | Stores the theme in your local library (theme dropdown) without switching the document. |
| **Apply** | Saves and applies the theme to the current document (one-click apply). |
| **Download JSON** | Downloads a valid theme file you can share or import later. |

Logo images are read as **data URLs** and stay on your device (no upload to a server).
Header bar colors and logo appear in the live preview page chrome.

Font pickers list common **system/Office** fonts and popular **web fonts** (marked
“web”). Web fonts load from Google Fonts for **preview only**. DOCX exports keep
the font family name; PDF maps families to standard substitutes (Helvetica /
Times / Courier). Choose **Custom…** to type any font name not in the list.

### Advanced path: export, edit JSON, re-import

1. Select a theme, click **Export theme** (share icon), save the `.json` file.
2. Edit the JSON in any text editor (or start from the creator’s Download JSON).
3. Click **Import theme** (palette icon) and select your file.

Imported and saved themes appear in the dropdown as **(imported)** and persist in
local storage until you clear site data.

### Required JSON structure

Top-level fields:

| Field | Required | Notes |
| :--- | :--- | :--- |
| `schemaVersion` | Yes | Must be `1`. |
| `metadata` | Yes | `id`, `name`, `version`, `author`, `description`, `license` (all strings; `id` must be unique). |
| `branding` | No | Optional page chrome: `logo` (data URL or `""`), `headerBackground`, `headerTextColor`, `showLogo`. Defaults applied if omitted. |
| `typography` | Yes | `body`, `heading`, `code` font family names. |
| `colors` | Yes | Six `#RRGGBB` hex colors: `primary`, `text`, `background`, `border`, `accent`, `codeBackground`. |
| `headings` | Yes | Styles for `h1`–`h6` (font, size, weight, italic, color, alignment, spacing). |
| `paragraph` | Yes | Body text style plus `lineHeight` and `alignment`. |
| `list` | Yes | `indent` and `spacing`. |
| `table` | Yes | Header colors, borders, padding. |
| `image` | Yes | `alignment`, `maxWidth`, `spacing`. |
| `code` | Yes | Code block font, colors, padding, spacing. |
| `quote` | Yes | Border, color, italic, indent, spacing. |
| `link` | Yes | `color`, `underline`. |
| `horizontalRule` | Yes | `color`, `thickness`, `spacing`. |

**Validation rules:**

- Colors must be exactly `#RRGGBB` (six hex digits).
- Font sizes and spacing values must be positive numbers (points).
- Font weight is 100–900.
- Alignment is `left`, `center`, `right`, or `justify`.

If import fails, the toolbar shows the first validation error (for example
`colors.primary: Colors must be #RRGGBB hex values`).

### Reference

- Built-in themes (37): core set (`minimal`, `modern`, `github`, `technical`,
  `corporate`, `elegant`, `documentation`), Google Docs–style templates
  (`spectrum`, `coral`, `spearmint`, `tropic`, `plum`, `geometric`, `writer`,
  `academic`, `newsletter`, `slate`, `sunset`, `forest`, `paper`, `midnight`,
  `meeting`, `proposal`), and Microsoft Office / Word–style templates
  (`office`, `facet`, `ion`, `organic`, `retrospect`, `slice`, `wisp`,
  `banded`, `dividend`, `whitepaper`, `resume`, `agenda`, `brochure`,
  `formal-letter`). See `packages/themes/src/builtin.ts`.
- Full schema: `packages/themes/src/schema.ts`.
- Sample workflow: [`examples/themes/README.md`](../../examples/themes/README.md).

---

## Creating a Word template to upload

Templates are **`.docx` files** created in Microsoft Word (or compatible
editors). Seamdoc reads styles and page setup from the file; it never modifies
the original.

### What the template provides

On import, Seamdoc:

1. Reads paragraph and table styles from `word/styles.xml`.
2. **Auto-maps** common Word style names to document nodes (see table below).
3. Copies page size, orientation, and margins from the document’s section
   properties into document settings.
4. On **DOCX export**, embeds the template’s `styles.xml` and applies your
   style mapping so headings and paragraphs use Word styles instead of direct
   formatting.

PDF export uses the **theme** for appearance; templates primarily affect DOCX.

### Preparing a template in Word

1. Create a new document or start from your corporate letterhead.
2. Define or rename styles with **conventional names** so auto-mapping works:

| Seamdoc node | Word style names recognized |
| :--- | :--- |
| Heading 1–6 | `Heading 1` … `Heading 6` (or `Heading1` … `Heading6`) |
| Paragraph | `Normal`, `Body Text` |
| Quote | `Quote`, `Intense Quote`, `Block Quote` |
| Code block | Any style whose name contains `code`, or `HTML Preformatted`, `Plain Text` |
| Table | First table style that is not `Normal Table` |

3. Set page size, orientation, and margins in Word’s layout dialog (these are
   imported into document settings).
4. Optionally set document properties (title, author, description) in Word—used
   as the template display name when title is present.
5. Save as **`.docx`** (not `.doc` or PDF).

### Import and fine-tune

1. Click **Import Word template** (layout-template icon).
2. A chip shows the template name; use **×** to remove it.
3. Open **Document settings** → **Template style mapping** to override any
   auto-mapping per node.
4. Export DOCX—the output uses template styles where mapped.

### Requirements and limits

| Requirement | Detail |
| :--- | :--- |
| File format | Valid DOCX (ZIP archive with `word/styles.xml` and `word/document.xml`). |
| Styles | At least one style must be defined. |
| Read-only | Import only reads the file; your master template on disk is unchanged. |
| Images in Markdown | Remote images appear as placeholders in preview and export (privacy). Only `data:image/…` URLs render as pixels. |
| Headers/footers in template | Template header/footer **references** are detected; body header/footer text still comes from document settings unless extended in a future release. |

### Reference

- Template engine: [`docs/02-architecture/template-engine.md`](../02-architecture/template-engine.md).
- Sample workflow: [`examples/templates/README.md`](../../examples/templates/README.md).

---

## Keyboard shortcuts

| Action | Windows / Linux | macOS |
| :--- | :--- | :--- |
| Find | `Ctrl+F` | `Cmd+F` |
| Replace | `Ctrl+H` | `Cmd+H` |

Monaco editor shortcuts (undo, redo, multi-cursor, etc.) work as in VS Code.

---

## Privacy notes

- Markdown, themes, templates, and preferences are stored in **browser local
  storage** (auto-save on reload).
- **No network requests** are made for document content or remote images in
  preview.
- Export downloads a file to your machine only when you click Export.

---

## Running the app locally (developers)

```bash
pnpm install
pnpm build          # once, or after package changes
cd apps/web
pnpm dev            # http://localhost:5173
```

Production preview: `pnpm build` then `pnpm --filter @seamdoc/web preview`
(http://localhost:4173).
