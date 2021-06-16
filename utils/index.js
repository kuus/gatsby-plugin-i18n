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
 *
 * @param {GatsbyI18n.I18n} i18n
 * @param {string} locale
 */
 const shouldCreateLocalisedPage = (i18n, locale) => {
  if (locale === i18n.defaultLocale && i18n.hideDefaultLocaleInUrl) {
    return false;
  }
  return true;
};

module.exports = {
  logger,
  normaliseUrlPath,
  normaliseRouteId,
  shouldCreateLocalisedPage,
};
