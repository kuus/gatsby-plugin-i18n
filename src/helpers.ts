import { useIntl as reactUseIntl } from "react-intl";
import { graphql, useStaticQuery, navigate as gatsbyNavigate } from "gatsby";
import { globalHistory, NavigateOptions } from "@reach/router";
import { GatsbyI18n } from "./types";
import { normaliseUrlPath, normaliseRouteId } from "../utils";
import i18nRoutes from "../.routes.json";

/**
 * Alias export for `useIntl` from `react-intl`, to ease import statements
 */
export const useIntl = reactUseIntl;

/**
 * Output a translated string by id, a shortcut to `useIntl().formatMessage`
 */
export const t = (id: string, data: { [key: string]: string }): string => reactUseIntl().formatMessage({ id }, data);

/**
 * Find route object that matches the given URL path
 */
export const getRouteByUrlPath = (urlPath: string): undefined | {
  id: string;
  locales: GatsbyI18n.Route
 } => {
  const normalisedPath = normaliseUrlPath(urlPath);
  for (const routeId in i18nRoutes) {
    const route = i18nRoutes[routeId];
    for (const routeLocale in route) {
      if (route[routeLocale] === normalisedPath) {
        return {
          id: routeId,
          locales: route
        };
      }
    }
  }
  return;
};

/**
 * Get current route locales based on browser's location
 * 
 * The replace is only needed for the `404.html` page.
 */
 export const getCurrentRoute = ()=> {
  const { location } = globalHistory;

  return getRouteByUrlPath(location.pathname.replace(".html", ""));
};

/**
 * Get the localised destination URL based on the given `routeId`
 *
 * Normalising here allows us to write links such as `"pages/about"` instead of
 * `"/pages/about/"` and still match the route key in the `.routes.json` (which
 * corresponds to the markdown file relative path).
 *
 * @param {string} [locale] It fallbacks to the currentLocale set on i18n page context
 * @returns {string} The URL destination
 */
export const getDestination = (i18n: GatsbyI18n.I18n, routeId: string, locale?: string): string => {
  locale = locale || i18n.currentLocale;
  const route = i18nRoutes[normaliseRouteId(routeId)];
  // TODO: maybe throw an error instead of returning the defaultLocale url
  const localisedTo = route ? route[locale] || route[i18n.defaultLocale] : "";

  if (typeof window === "undefined") {
    return localisedTo;
  }

  return `${localisedTo}${window.location.search}`;
};

/**
 * @inheritdoc(getDestination)
 */
export const getDestinationSQ = (i18n: GatsbyI18n.I18n, routeId: string, locale?: string): string => {
  locale = locale || i18n.currentLocale;
  routeId = normaliseRouteId(routeId);
  const data = useStaticQuery(graphql`
    {
      allI18NRoute {
        nodes {
          routeId
          fields {
            it
            en
          }
        }
      }
    }
  `);

  const nodes = data.allI18NRoute.nodes.filter(
    (node) => node.routeId === routeId
  );
  let localisedTo = "";

  if (nodes[0] && nodes[0].fields[locale]) {
    localisedTo = nodes[0].fields[locale];
  }

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
  route: string,
  options: NavigateOptions<T>
) => {
  const destination = getDestination(i18n, route);
  gatsbyNavigate(destination, options);
};

/**
 * Change locale helper, to be used in I18nSwitch component
 */
export const changeLocale = (i18n: GatsbyI18n.I18n, locale: string) => {
  const route = getCurrentRoute();

  if (route) {
    const destination = getDestination(i18n, route.id, locale);
  
    localStorage.setItem("gatsby-i18n-locale", locale);
  
    gatsbyNavigate(destination);
  }
};
