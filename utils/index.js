// @ts-check

/**
 * Internal logger
 *
 * @param {"log" | "info" | "error" | "warn"} type Console method
 * @param {string} msg Log message
 */
var logger = function logger(type, msg) {
  if (type === void 0) {
    type = "log";
  }

  console[type]("[gatsby-i18n]: " + msg);
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


var normaliseUrlPath = function normaliseUrlPath(input) {
  input = input.replace(/\/+\//g, "/") + "/";
  return "/" + input.replace(/^\/+/, "").replace(/\/+$/, "/");
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


var normaliseRouteId = function normaliseRouteId(input) {
  // input = input.replace("pages", "");
  input = normaliseUrlPath("/" + input + "/");
  return input;
};
/**
 * Find route object that matches the given path
 *
 * @param {GatsbyI18n.RoutesMap} routes
 * @param {string} path The current window.location pathname
 * @returns {GatsbyI18n.Route}
 */


var findRouteForPath = function findRouteForPath(routes, path) {
  var normalisedPath = normaliseUrlPath(path);

  for (var routeKey in routes) {
    var route = routes[routeKey];

    for (var routeLocale in route) {
      // FIXME: check this triple condition, only the second should be enough
      if (routeKey === normalisedPath || route[routeLocale] === normalisedPath || route[routeLocale].replace("/" + routeLocale, "") === normalisedPath) {
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


var getCurrentRoute = function getCurrentRoute(location, locale) {
  if (typeof window === "undefined") {
    return;
  }

  var routes = window["___gatsbyI18n"].routes;
  var matchedRoute = findRouteForPath(routes, location.pathname);

  if (matchedRoute) {
    return matchedRoute[locale] || "/" + locale + "/404";
  }

  return "/" + locale + "/404";
};

module.exports = {
  logger: logger,
  normaliseUrlPath: normaliseUrlPath,
  normaliseRouteId: normaliseRouteId,
  findRouteForPath: findRouteForPath,
  getCurrentRoute: getCurrentRoute
};