import { useIntl as reactUseIntl } from "react-intl";
import { graphql, useStaticQuery, navigate as gatsbyNavigate } from "gatsby";
import { NavigateOptions } from "@reach/router";
import { GatsbyI18n } from "./types";
import { normaliseRouteId } from "../utils";

/**
 * Alias export for `useIntl` from `react-intl`, to ease import statements
 */
export const useIntl = reactUseIntl;

/**
 * Output a translated string by id, a shortcut to `useIntl().formatMessage`
 */
export const t = (id: string, data?: { [key: string]: string }): string => reactUseIntl().formatMessage({ id }, data);

/**
 * Get the localised destination URL based on the given `routeId`
 *
 * Normalising here allows us to write links such as `"pages/about"` instead of
 * `"/pages/about/"` and still match the route file in the `/.routes/` folder
 * (whose name which corresponds to the Markdown/File node relative path).
 *
 * @param {string} [locale] It fallbacks to the currentLocale set on i18n page context
 * @returns {string} The URL destination
 */
export const getRouteUrl = (i18n: GatsbyI18n.I18n, routeId: string, locale?: string): string => {
  locale = locale || i18n.currentLocale;
  routeId = normaliseRouteId(routeId);
  const localisedTo = require(`../.routes/${routeId.replace(/\//g, "_")}--${locale}.json`).url;

  if (typeof window === "undefined") {
    return localisedTo;
  }

  return `${localisedTo}${window.location.search}`;
};

/**
 * Localised version of native Gatsby's `navigate`
 *
 * @see https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-the-navigate-helper-function
 */
export const navigate = <T extends {}>(
  i18n: GatsbyI18n.I18n,
  locale: string,
  options?: NavigateOptions<T>
) => {
  const { alternates } = i18n;
  const destination = alternates.filter((alternate) => alternate.locale === locale);
  
  if (destination[0]) {
    localStorage.setItem("gatsby-i18n-locale", locale);
    gatsbyNavigate(destination[0].url, options);
  }
};

/**
 * Get current route locales based on browser's location
 * 
 * The replace is only needed for the `404.html` page.
 * 
 * @deprecated
 */
// const getCurrentRoute = ()=> {
//   const { location } = globalHistory;
//   return getRouteByUrlPath(location.pathname.replace(".html", ""));
// };
