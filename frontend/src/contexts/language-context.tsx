import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import i18n from "@/i18n";

export type Language = "sw" | "en";

type TranslationSet = {
  nav: {
    features: string;
    examples: string;
    pricing: string;
    start: string;
    closeMenu: string;
    openMenu: string;
    home: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    start: string;
    learnMore: string;
    imageAlt: string;
  };
  premium: {
    eyebrow: string;
    subtitle: string;
    join: string;
  };
  ai: {
    assistant: string;
    subtitle: string;
    active: string;
    newChat: string;
    history: string;
    searchChats: string;
    searchHistory: string;
    historyEmpty: string;
    noHistoryResults: string;
    images: string;
    library: string;
    scheduled: string;
    loading: string;
    examples: Array<{ title: string; description: string }>;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Array<{ quote: string; name: string; role: string }>;
    stars: string;
  };
  footer: {
    services: string;
    company: string;
    contact: string;
    about: string;
    help: string;
    contactLink: string;
    privacy: string;
    terms: string;
    description: string;
    location: string;
    copyright: string;
    privacyBody: string;
    termsBody: string;
    understood: string;
    close: string;
  };
};

export const translations: Record<Language, TranslationSet> = {
  sw: {
    nav: { features: "Sifa zote", examples: "Mifano", pricing: "Bei", start: "Anza Sasa", closeMenu: "Funga menyu", openMenu: "Fungua menyu", home: "Nyumbani", language: "Lugha" },
    hero: {
      eyebrow: "Msaada wa kwanza wa AI wa ujenzi Tanzania",
      title: "Jenga Nyumba Yako na Msaada wa AI",
      subtitle: "Panga ramani, kikokotoo cha vifaa vyote vya ujenzi, na makadirio ya gharama sahihi kwa soko la Tanzania. Punguza gharama na uepuke makosa ya ujenzi.",
      start: "Anza Sasa",
      learnMore: "Jifunze Zaidi",
      imageAlt: "Nyumba ya kisasa yenye bwawa, msaada wa JengaAI",
    },
    premium: { eyebrow: "JengaAI Premium", subtitle: "Pata zana zote za JengaAI kwa urahisi, usahihi, na msaada wa kitaalamu kwenye mradi wako.", join: "Jiunge na Premium" },
    ai: {
      assistant: "JengaAI Assistant",
      subtitle: "Msaidizi wako wa mipango ya ujenzi",
      active: "Inafanya kazi",
      newChat: "Mazungumzo mapya",
      history: "Historia",
      searchChats: "Tafuta mazungumzo",
      searchHistory: "Tafuta historia...",
      historyEmpty: "Mazungumzo yako ya awali yataonekana hapa.",
      noHistoryResults: "Hakuna mazungumzo yanayolingana.",
      images: "Picha",
      library: "Maktaba",
      scheduled: "Zilizopangwa",
      loading: "Inapakia mifano zaidi…",
      examples: [
        { title: "Ramani ya vyumba 3", description: "Panga nafasi za familia yako kwa ufanisi." },
        { title: "Kikokotoo cha vifaa", description: "Jua kiasi cha saruji, mchanga na nondo." },
        { title: "Makadirio ya gharama", description: "Pata bajeti inayolingana na soko la Tanzania." },
        { title: "Ratiba ya ujenzi", description: "Panga hatua za mradi wako bila kuchelewa." },
        { title: "Ushauri wa vifaa", description: "Chagua vifaa bora kwa bajeti yako." },
        { title: "Mwongozo wa vibali", description: "Elewa hatua za kupata kibali cha ujenzi." },
      ],
    },
    testimonials: {
      eyebrow: "Maoni ya wateja",
      title: "Watu wanaojenga kwa ujasiri zaidi",
      stars: "Nyota tano",
      items: [
        { quote: "JengaAI imenisaidia kujua bajeti yangu kabla sijaanza ujenzi.", name: "Neema M.", role: "Mmiliki wa nyumba, Dodoma" },
        { quote: "Kikokotoo cha vifaa kimenipunguzia makosa na matumizi yasiyo ya lazima.", name: "Baraka J.", role: "Mjenzi, Mbeya" },
        { quote: "Nilipata ramani na mpangilio wa kazi unaoeleweka kwa muda mfupi.", name: "Asha K.", role: "Mjasiriamali, Dar es Salaam" },
      ],
    },
    footer: {
      services: "Huduma", company: "KAMPUNI", contact: "Mawasiliano", about: "Kuhusu Sisi", help: "Msaada", contactLink: "Wasiliana", privacy: "Sera ya Faragha", terms: "Masharti ya Huduma", description: "Tunakusaidia kujenga ndoto zako. Mfumo wa kisasa wa AI ulioumbwa kurahisisha ujenzi wa nyumba kwa soko la Tanzania.", location: "Mbeya, Tanzania", copyright: "© 2026 JengaAI Tanzania. Haki zote zimehifadhiwa.", privacyBody: "Tunaheshimu faragha yako. Taarifa unazowasilisha hutumika kukusaidia kupanga mradi wako na kuboresha huduma. Hatuuzi taarifa zako kwa watu wengine.", termsBody: "Kwa kutumia JengaAI, unakubali kutumia makadirio, ramani na ushauri kama mwongozo wa awali. Kila mradi unapaswa kuthibitishwa na mtaalamu mwenye sifa pamoja na mamlaka husika.", understood: "Nimeelewa", close: "Funga",
    },
  },
  en: {
    nav: { features: "Features", examples: "Examples", pricing: "Pricing", start: "Get Started", closeMenu: "Close menu", openMenu: "Open menu", home: "Home", language: "Language" },
    hero: {
      eyebrow: "Tanzania's first AI construction assistant",
      title: "Build Your Home with AI Support",
      subtitle: "Plan layouts, calculate all your building materials, and get accurate cost estimates for the Tanzanian market. Reduce costs and avoid construction mistakes.",
      start: "Get Started",
      learnMore: "Learn More",
      imageAlt: "Modern house with a pool, supported by JengaAI",
    },
    premium: { eyebrow: "JengaAI Premium", subtitle: "Get every JengaAI tool with ease, accuracy, and professional support for your project.", join: "Join Premium" },
    ai: {
      assistant: "JengaAI Assistant",
      subtitle: "Your construction planning assistant",
      active: "Active",
      newChat: "New conversation",
      history: "History",
      searchChats: "Search chats",
      searchHistory: "Search history...",
      historyEmpty: "Your previous conversations will appear here.",
      noHistoryResults: "No matching conversations.",
      images: "Images",
      library: "Library",
      scheduled: "Scheduled",
      loading: "Loading more examples…",
      examples: [
        { title: "3-bedroom floor plan", description: "Plan your family's spaces efficiently." },
        { title: "Material calculator", description: "Know the amount of cement, sand, and steel." },
        { title: "Cost estimate", description: "Get a budget aligned with the Tanzanian market." },
        { title: "Construction schedule", description: "Plan your project stages without delays." },
        { title: "Material guidance", description: "Choose quality materials for your budget." },
        { title: "Permit guide", description: "Understand the steps to obtain a building permit." },
      ],
    },
    testimonials: {
      eyebrow: "Customer stories",
      title: "Helping people build with confidence",
      stars: "Five stars",
      items: [
        { quote: "JengaAI helped me understand my budget before starting construction.", name: "Neema M.", role: "Homeowner, Dodoma" },
        { quote: "The material calculator reduced mistakes and unnecessary spending.", name: "Baraka J.", role: "Builder, Mbeya" },
        { quote: "I got a clear plan and project schedule in a short time.", name: "Asha K.", role: "Entrepreneur, Dar es Salaam" },
      ],
    },
    footer: {
      services: "SERVICES", company: "COMPANY", contact: "CONTACT", about: "About Us", help: "Help", contactLink: "Contact", privacy: "Privacy Policy", terms: "Terms of Service", description: "We help you build your dreams. A modern AI system created to simplify home construction for the Tanzanian market.", location: "Mbeya, Tanzania", copyright: "© 2026 JengaAI Tanzania. All rights reserved.", privacyBody: "We respect your privacy. Information you provide is used to help plan your construction project and improve our services. We do not sell your information to others.", termsBody: "By using JengaAI, you agree to use estimates, plans, and guidance as an initial reference. Every project must be verified by a qualified professional and the relevant authorities.", understood: "I understand", close: "Close",
    },
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: (language: Language) => void;
  t: TranslationSet;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("jengaai-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    void i18n.changeLanguage(nextLanguage);
  }

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("jengaai-language");
    if ((savedLanguage === "en" || savedLanguage === "sw") && savedLanguage !== language) {
      setLanguageState(savedLanguage);
      return;
    }
    document.documentElement.lang = language;
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, toggleLanguage: setLanguage, t: translations[language] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
