import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en-US';

export default i18n.use(initReactI18next).init({
  resources: {
    en,
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});
