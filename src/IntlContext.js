import React, { useContext } from "react";

const IntlContext = React.createContext();
export const IntlContextProvider = IntlContext.Provider;
export const IntlContextConsumer = IntlContext.Consumer;

// export const useI18n = useContext(IntlContext);
