import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Seamdoc',
  description: 'Open-source semantic document rendering platform. Convert Markdown to beautifully themed Word (DOCX) and PDF files directly in your browser.',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide' },
      { text: 'API Reference', link: '/api' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'What is Seamdoc?', link: '/guide' },
          { text: 'Installation', link: '/installation' },
        ]
      },
      {
        text: 'Core Features',
        items: [
          { text: 'Theme Engine', link: '/theme-engine' },
          { text: 'Templates', link: '/templates' },
          { text: 'Exporters', link: '/exporters' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/seamdoc/seamdoc' }
    ]
  }
});
