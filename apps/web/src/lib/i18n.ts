import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        // ThemeCreatorPanel
        themeCreatorTitle: 'Theme creator',
        designVisually: 'Design visually, then Save, Apply, or Download JSON',
        closeThemeCreator: 'Close theme creator',
        save: 'Save',
        apply: 'Apply',
        downloadJson: 'Download JSON',

        // Theme Randomizer
        themeRandomizerTitle: 'Theme Randomizer',
        randomThemeButton: 'Roll Random Theme',
        randomThemeLabel:
          'Instantly generate a random harmonious typography and color configuration.',
        randomThemeSuccess: 'Generated a random theme!',

        // AppSettingsPanel
        appPreferences: 'App preferences',
        closeAppPreferences: 'Close app preferences',
        darkMode: 'Dark mode',
        highContrast: 'High contrast',
        defaultThemeLabel: 'Default theme for new documents',
        defaultExportFormat: 'Default export format',
        geminiApiKeyLabel: 'Gemini API Key (AI Layout & Theme)',
        geminiApiKeyPlaceholder: 'Enter Gemini API key...',
        preferencesFootnote: 'Preferences are saved locally. New documents use the default theme.',
        themeImported: '(imported)',

        // ThemeSelect
        searchThemes: 'Search themes...',
        builtinThemesSection: 'Built-in Themes',
        customThemesSection: 'Custom Themes',
        noThemesFound: 'No themes found matching your search',
        headingPreviewText: 'Heading',
        bodyPreviewText: 'Document body text styling preview',
        activeThemeLabel: 'Active',
        clickToChangeTheme: 'Click to change theme',

        // SettingsPanel
        documentSettings: 'Document settings',
        closeSettings: 'Close settings',
        documentTitle: 'Document title',
        author: 'Author',
        description: 'Description',
        keywordsLabel: 'Keywords (comma-separated)',
        language: 'Language',
        pageSize: 'Page size',
        orientation: 'Orientation',
        portrait: 'Portrait',
        landscape: 'Landscape',
        marginsLegend: 'Margins (pt)',
        bodyFont: 'Body font (blank = theme default)',
        themeDefault: 'Theme default',
        sizeLabel: 'Size (pt)',
        lineLabel: 'Line',
        paraLabel: 'Para (pt)',
        headerText: 'Header text',
        footerText: 'Footer text',
        pdfSecurityTitle: 'PDF Security',
        pdfSecurityDescription: 'Set password protection and encrypt your exported PDF document.',
        userPassword: 'User / Open Password',
        ownerPassword: 'Owner / Edit Password',
        noPasswordSet: 'No password set',
        noOwnerPassword: 'No owner password',
        pageNumbers: 'Page numbers',

        // Toolbar
        toolbarNewDoc: 'Start a blank document (clears the editor and applies your default theme)',
        toolbarNewDocAriaLabel: 'New document',
        toolbarOpenFile: 'Open a Markdown file (.md) from your computer',
        toolbarOpenFileAriaLabel: 'Open Markdown file',
        themeLabel: 'Theme',
        toolbarThemeCreator:
          'Open the theme creator to design a theme visually (Save, Apply, or Download JSON)',
        toolbarThemeCreatorAriaLabel: 'Theme creator',
        toolbarImportTheme:
          'Upload a custom theme JSON file (export a built-in theme first to use as a template)',
        toolbarImportThemeAriaLabel: 'Import theme',
        toolbarExportTheme: 'Download the active theme as JSON so you can edit or share it',
        toolbarExportThemeAriaLabel: 'Export active theme',
        toolbarImportTemplate:
          'Upload a Word .docx template to apply corporate styles when exporting to DOCX',
        toolbarImportTemplateAriaLabel: 'Import Word template',
        toolbarRemoveTemplate: 'Remove template and restore page settings from before import',
        toolbarRemoveTemplateAriaLabel: 'Remove template',
        toolbarDocSettings:
          'Document title, page layout, headers, footers, and template style mapping',
        toolbarDocSettingsAriaLabel: 'Document settings',
        toolbarAppPrefs:
          'App preferences: dark mode, high contrast, default theme, and export format',
        toolbarAppPrefsAriaLabel: 'App preferences',
        toolbarAiCritic: 'AI Layout Critic: review document for formatting, hierarchy and spacing',
        toolbarAiCriticAriaLabel: 'AI Layout Critic',
        toolbarDarkModeOn: 'Switch to light mode',
        toolbarDarkModeOff: 'Switch to dark mode',
        toolbarDarkModeAriaLabel: 'Toggle dark mode',
        exportPdf: 'Export PDF',
        exportDocx: 'Export DOCX',
        exportingLabel: 'Exporting…',
        exportEllipsis: 'Export…',

        // CriticPanel
        aiLayoutCritic: 'AI Layout Critic',
        closeAiLayoutCritic: 'Close AI Layout Critic',
        runAiCritic: 'Run AI Critic',
        analyzingDocument: 'Analyzing Document...',
        noIssuesFound: 'No issues found',
        noIssuesDescription:
          'Your heading hierarchy, paragraph sizes, and tables look solid. Run the critic to scan.',
        findingWarning: 'Warning',
        findingImprovement: 'Improvement',
        suggestionLabel: 'Suggestion:',
        autoFix: 'Auto-Fix',

        // StyleMapper
        styleMappingTitle: 'Style mapping',
        styleMapperDescription: 'Map Markdown elements to Word styles from the imported template.',
        heading1: 'Heading 1',
        heading2: 'Heading 2',
        heading3: 'Heading 3',
        heading4: 'Heading 4',
        heading5: 'Heading 5',
        heading6: 'Heading 6',
        bodyText: 'Body Text',
        blockQuote: 'Block Quote',
        codeBlock: 'Code Block',
        table: 'Table',
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
