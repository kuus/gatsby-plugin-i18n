import React, { useContext } from "react";

const I18nContext = React.createContext();

export const I18nProvider = I18nContext.Provider;
export const I18nConsumer = I18nContext.Consumer;

export const useI18n = () => useContext(I18nContext);
