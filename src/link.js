import React from "react";
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby";
import { IntlContextConsumer } from "./IntlContext";
import { findRouteForPath } from "./utils";
import i18nRoutes from "./.routes.json";

const getDestination = ({ i18n, to, language }) => {
  // console.log("getDestination: i18nRoutes", i18nRoutes, "while i18n is", i18n);
  const route = i18nRoutes[to];
  const lang = language || i18n.currentLanguage;
  const localisedTo = route ? route[lang] || route[i18n.defaultLanguage] : to;

  if (typeof window === "undefined") {
    return localisedTo;
  }

  return `${localisedTo}${window.location.search}`;
};

const Link = React.forwardRef(
  ({ to, params, language, children, onClick, ...restProps }, ref) => (
    // const Link = ({ to, language, children, onClick, ...restProps }) => (
    <IntlContextConsumer>
      {(i18n) => {
        let destination = getDestination({ i18n, to, language });
        const lang = language || i18n.currentLanguage;
        const handleClick = (e) => {
          if (lang) {
            localStorage.setItem("gatsby-i18n-language", lang);
          }
          if (onClick) {
            onClick(e);
          }
        };

        // TODO: add optional parameters to the detination URL
        if (params) {
          let idx = 1;
          let paramsQuantity = Object.keys(params).length;
          destination += "?";
          for (const paramKey in params) {
            destination += `${paramKey}=${params[paramKey]}`;
            if (idx !== paramsQuantity) {
              destination += "&";
            }
            idx++;
          }
        }

        return (
          <GatsbyLink
            ref={ref}
            {...restProps}
            to={destination}
            onClick={handleClick}
          >
            {children}
          </GatsbyLink>
        );
      }}
    </IntlContextConsumer>
    // );
  )
);

export const navigate = (to, options) => {
  if (typeof window === "undefined") {
    return;
  }

  const destination = getDestination({ i18n: window.___gatsbyI18n, to });
  gatsbyNavigate(destination, options);
};

export const changeLocale = (language, to) => {
  if (typeof window === "undefined") {
    return;
  }

  const destination = getDestination({
    i18n: window.___gatsbyI18n,
    to,
    language,
  });
  localStorage.setItem("gatsby-i18n-language", language);
  gatsbyNavigate(destination);
};

export const getCurrentRoute = (location, language) => {
  if (typeof window === "undefined") {
    return;
  }

  const { routes } = window.___gatsbyI18n;
  const matchedRoute = findRouteForPath(routes, location.pathname);

  if (matchedRoute) {
    return matchedRoute[language] || `/${language}/404`;
  }
  return `/${language}/404`;
};

export default Link;
