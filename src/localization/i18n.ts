import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        appName: "vcode",
        titleHomePage: "Home Page",
        titleSecondPage: "Second Page",
      },
    },
    "pt-BR": {
      translation: {
        appName: "vcode",
        titleHomePage: "Página Inicial",
        titleSecondPage: "Segunda Página",
      },
    },
  },
});
