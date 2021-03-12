// @ts-check

import React from "react";
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby";
import { IntlContextConsumer } from "./IntlContext";
import { findRouteForPath, normaliseUrlPath } from "./utils";
import i18nRoutes from "./.routes.json";

const getDestination = ({ i18n, to, locale }) => {
  // console.log("getDestination: i18nRoutes", i18nRoutes, "while i18n is", i18n);
  // normalising here allows us to write links such as "pages/about" instead of
  // "/pages/about/" and still match the route key in the `.routes.json` (which
  // corresponds to the markdown file relative path)
  const route = i18nRoutes[normaliseUrlPath(to)];
  locale = locale || i18n.currentLocale;
  const localisedTo = route ? route[locale] || route[i18n.defaultLocale] : to;

  if (typeof window === "undefined") {
    return localisedTo;
  }

  return `${localisedTo}${window.location.search}`;
};

const Link = React.forwardRef(
  ({ to, params, locale, children, onClick, ...restProps }, ref) => (
    // const Link = ({ to, locale, children, onClick, ...restProps }) => (
    <IntlContextConsumer>
      {(i18n) => {
        let destination = getDestination({ i18n, to, locale });
        locale = locale || i18n.currentLocale;
        const handleClick = (e) => {
          if (locale) {
            localStorage.setItem("gatsby-i18n-locale", locale);
          }
          if (onClick) {
            onClick(e);
          }
        };

        // TODO: add optional parameters to the destination URL
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

  const destination = getDestination({ i18n: window["___gatsbyI18n"], to });
  gatsbyNavigate(destination, options);
};

export const changeLocale = (locale, to) => {
  if (typeof window === "undefined") {
    return;
  }

  const destination = getDestination({
    i18n: window["___gatsbyI18n"],
    to,
    locale,
  });
  localStorage.setItem("gatsby-i18n-locale", locale);
  gatsbyNavigate(destination);
};

export const getCurrentRoute = (location, locale) => {
  if (typeof window === "undefined") {
    return;
  }

  const { routes } = window["___gatsbyI18n"];
  const matchedRoute = findRouteForPath(routes, location.pathname);

  if (matchedRoute) {
    return matchedRoute[locale] || `/${locale}/404`;
  }
  return `/${locale}/404`;
};

export default Link;
