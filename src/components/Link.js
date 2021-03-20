// @ts-check

import React from "react";
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby";
import { useI18n } from "./I18nContext";
import { normaliseRouteId, normaliseUrlPath } from "../utils";
import i18nRoutes from "../.routes.json";

/**
 * Get the localised destination URL based on the given `routeId`
 *
 * Normalising here allows us to write links such as `"pages/about"` instead of
 * `"/pages/about/"` and still match the route key in the `.routes.json` (which
 * corresponds to the markdown file relative path).
 *
 * @param {GatsbyI18n.PageContext["i18n"]} i18n
 * @param {string} routeId
 * @param {string} [locale] It fallbacks to the currentLocale set on i18n page context
 * @returns {string} The URL destination
 */
const getDestination = (i18n, routeId, locale) => {
  // console.log("getDestination: i18nRoutes", i18nRoutes, "while i18n is", i18n);
  const route = i18nRoutes[normaliseRouteId(routeId)];
  locale = locale || i18n.currentLocale;
  const localisedTo = route
    ? route[locale] || route[i18n.defaultLocale]
    : normaliseUrlPath(routeId);

  if (typeof window === "undefined") {
    return localisedTo;
  }

  return `${localisedTo}${window.location.search}`;
};

/**
 * Localised version fo native Gatsby's `<Link>` component
 *
 * @see https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-gatsby-link
 *
 * @type {React.FC<{
 *   to: string;
 *   params: { [key: string]: string; };
 *   locale?: string;
 *   onClick?: Function;
 * }>}
 */
export const Link = React.forwardRef(
  ({ to, params, locale, children, onClick, ...restProps }, ref) => {
    const i18n = useI18n();
    locale = locale || i18n.currentLocale;
    let destination = getDestination(i18n, to, locale);

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
  }
);

/**
 * Localised version of native Gatsby's `navigate`
 *
 * @see https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-the-navigate-helper-function
 * @param {string} to
 * @param {import("@reach/router").NavigateOptions} options
 */
export const navigate = (to, options) => {
  if (typeof window === "undefined") {
    return;
  }

  const destination = getDestination(window["___gatsbyI18n"], to);
  gatsbyNavigate(destination, options);
};

/**
 * Change locale helper, to be used in I18nSwitcher component
 *
 * @param {string} locale
 * @param {string} to
 * @returns
 */
export const changeLocale = (locale, to) => {
  if (typeof window === "undefined") {
    return;
  }

  const destination = getDestination(window["___gatsbyI18n"], to, locale);

  localStorage.setItem("gatsby-i18n-locale", locale);

  gatsbyNavigate(destination);
};

export default Link;
