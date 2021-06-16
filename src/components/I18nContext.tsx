import React, { useContext } from "react";
import { defaultConfig } from "../../utils/options";

const I18nContext = React.createContext<GatsbyI18n.Context["i18n"]>({
  ...defaultConfig,
  alternates: [],
  // these three are just to don't make typescript complain...
  url: () => '',
  currentLocale: "",
  messages: {},
});

export const I18nProvider = I18nContext.Provider;
export const I18nConsumer = I18nContext.Consumer;

export const useI18n = () => {
  const i18n = useContext(I18nContext);
  return i18n;
};
