// @ts-check

/**
 * Internal logger
 *
 * @param {"log" | "info" | "error" | "warn"} type Console method
 * @param {string} msg Log message
 */
const logger = (type = "log", msg) => {
  console[type](`[gatsby-i18n]: ${msg}`);
};

/**
 * Normalise URL path
 *
 * Always add a slash at the begininng and enforce the trailing slash.
 * The reason for the trailing slash is explained in the README,
 * @see https://github.com/gatsbyjs/gatsby/issues/9207
 *
 * @param {string} input
 * @returns {string}
 */
const normaliseUrlPath = (input) => {
  input = input.replace(/\/+\//g, "/") + "/";
  return `/${input.replace(/^\/+/, "").replace(/\/+$/, "/")}`;
};

/**
 * Normalise route id
 * 
 * TODO: decide whether to have e.g.
 * "parent-page" instead of "/parent/page":
 * route = route.replace(/\//g, "-").replace(/^-/, "");
 * return route || "index";

 * @param {string} input 
 */
const normaliseRouteId = (input) => {
  // input = input.replace("pages", "");
  input = normaliseUrlPath(`/${input}/`);
  return input;
};

/**
 * Find route object that matches the given path
 *
 * @param {GatsbyI18n.RoutesMap} routes
 * @param {string} path The current window.location pathname
 * @returns {GatsbyI18n.Route}
 */
const findRouteForPath = (routes, path) => {
  const normalisedPath = normaliseUrlPath(path);
  for (const routeKey in routes) {
    const route = routes[routeKey];
    for (const routeLocale in route) {
      // FIXME: check this triple condition, only the second should be enough
      if (
        routeKey === normalisedPath ||
        route[routeLocale] === normalisedPath ||
        route[routeLocale].replace(`/${routeLocale}`, "") === normalisedPath
      ) {
        return route;
      }
    }
  }
  return null;
};

/**
 * Get current route based on browser's location
 *
 * @param {import("@reach/router").WindowLocation} location
 * @param {string} locale
 * @returns {?string}
 */
const getCurrentRoute = (location, locale) => {
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

module.exports = {
  logger,
  normaliseUrlPath,
  normaliseRouteId,
  findRouteForPath,
  getCurrentRoute,
};
