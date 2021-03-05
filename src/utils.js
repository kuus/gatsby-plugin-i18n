// @ts-check

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
 * let route = name === "index" ? dir : dir + "-" + name;
 * route = route.replace(/\//g, "-").replace(/^-/, "");
 * return route || "index";

 * @param {string} input 
 */
const normaliseRouteId = (input) => {
  input = normaliseUrlPath(`/${input}/`);
  return input;
};

/**
 * Find route object that matches the given path
 *
 * @param {string} path The current window.location pathname
 * @returns ?GatsbyI18n.Route
 */
const findRouteForPath = (routes, path) => {
  const normalisedPath = normaliseUrlPath(path);
  for (const routeKey in routes) {
    const route = routes[routeKey];
    for (const routeLocale in route) {
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

module.exports = {
  normaliseUrlPath,
  normaliseRouteId,
  findRouteForPath,
};
