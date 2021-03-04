/**
 * Normalise slashes
 *
 * Always add a slash at the begininng and enforce the trailing slash.
 * The reason for the trailing slash is explained in the README,
 * @see https://github.com/gatsbyjs/gatsby/issues/9207
 *
 * @param {string} url
 * @returns {string}
 */
const normaliseSlashes = (url) => {
  url = url.replace(/\/+\//g, "/") + "/";
  return `/${url.replace(/^\/+/, "").replace(/\/+$/, "/")}`;
};

/**
 * Find route object that matches the given path
 *
 * @param {string} path The current window.location pathname
 * @returns ?GatsbyI18n.Route
 */
const findRouteForPath = (routes, path) => {
  const normalisedPath = normaliseSlashes(path);
  for (const routeKey in routes) {
    const route = routes[routeKey];
    for (const routeLang in route) {
      if (
        routeKey === normalisedPath ||
        route[routeLang] === normalisedPath ||
        route[routeLang].replace(`/${routeLang}`, "") === normalisedPath
      ) {
        return route;
      }
    }
  }
  return null;
};

module.exports = {
  normaliseSlashes,
  findRouteForPath,
};
