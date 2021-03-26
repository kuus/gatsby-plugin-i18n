import React, { useContext } from "react";
import { GatsbyI18n } from "../types";
import { defaultConfig } from "../../utils/options";

const I18nContext = React.createContext<GatsbyI18n.I18n>({
  ...defaultConfig,
  alternates: []
});

export const I18nProvider = I18nContext.Provider;
export const I18nConsumer = I18nContext.Consumer;

export const useI18n = () => {
  const i18n = useContext(I18nContext);
  return i18n;
};
