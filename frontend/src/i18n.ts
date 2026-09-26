import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  sw: {
    translation: {
      welcome: "Welcome",
      chat: "Chat",
      change_language: "Change language",
      swahili: "Swahili",
      english: "English",
      switchTo: "Switch language to {{language}}",
      // Tumeongeza maneno ya SiteHeader hapa:
      nav: {
        features: "Sifa zote",
        howItWorks: "Inavyofanya kazi",
        examples: "Mifano",
        pricing: "Bei",
        getStarted: "Anza Sasa",
        closeMenu: "Funga menyu",
        openMenu: "Fungua menyu",
      },
    },
  },
  en: {
    translation: {
      welcome: "Welcome",
      chat: "Chat",
      change_language: "Change language",
      swahili: "Swahili",
      english: "English",
      switchTo: "Switch language to {{language}}",
      // Tumeongeza maneno ya SiteHeader ya Kiingereza hapa:
      nav: {
        features: "Features",
        howItWorks: "How it works",
        examples: "Examples",
        pricing: "Pricing",
        getStarted: "Get Started",
        closeMenu: "Close menu",
        openMenu: "Open menu",
      },
    },
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["sw", "en"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
 