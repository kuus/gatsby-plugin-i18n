import { graphql, useStaticQuery, navigate as gatsbyNavigate } from "gatsby";
import { globalHistory, NavigateOptions } from "@reach/router";
import { GatsbyI18n } from "./types";
import { useI18n } from "./components/I18nContext";
import { normaliseUrlPath, normaliseRouteId } from "../utils";
import i18nRoutes from "../.routes.json";

/**
 * Find route object that matches the given path
 */
export const findRouteForPath = (path: string): undefined | GatsbyI18n.Route => {
  const normalisedPath = normaliseUrlPath(path);
  for (const routeKey in i18nRoutes) {
    const route = i18nRoutes[routeKey];
    for (const routeLocale in route) {
      // FIXME: check this triple condition, only the second should be enough
      if (route[routeLocale] === normalisedPath) {
        return route;
      }
    }
  }
  return;
};

/**
 * Get current route based on browser's location
 */
export const getCurrentRoute = (): undefined | GatsbyI18n.Route => {
  const { location } = globalHistory;

  return findRouteForPath(location.pathname);
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
export const getDestination = (routeId: string, locale?: string): string => {
  const i18n = useI18n();
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
export const getDestinationSQ = (routeId: string, locale?: string): string => {
  const i18n = useI18n();
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
  to: string,
  options: NavigateOptions<T>
) => {
  const destination = getDestination(to);
  gatsbyNavigate(destination, options);
};

/**
 * Change locale helper, to be used in I18nSwitcher component
 */
export const changeLocale = (locale: string) => {
  const route = getCurrentRoute();
  if (route) {
    const destination = getDestination(route[locale], locale);
  
    localStorage.setItem("gatsby-i18n-locale", locale);
  
    gatsbyNavigate(destination);
  }
};
