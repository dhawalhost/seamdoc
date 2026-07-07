import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        themeCreatorTitle: 'Theme creator',
        designVisually: 'Design visually, then Save, Apply, or Download JSON',
        closeThemeCreator: 'Close theme creator',
        save: 'Save',
        apply: 'Apply',
        downloadJson: 'Download JSON',
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
