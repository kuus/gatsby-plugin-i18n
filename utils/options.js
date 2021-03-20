var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

// @ts-check

/**
 * @type {GatsbyI18n.Options}
 */
var defaultOptions = {
  debug: false,
  pathConfig: "src/content/settings/i18n/config.yml",
  pathMessages: "src/content/settings/i18n/messages",
  pathContent: ["src/content"],
  // excludePaths: ["admin"],
  excludePaths: [],
  templateName: "tpl.tsx",
  untranslatedComponent: null,
  useMdx: true,
  frontmatterKeyForLocalisedSlug: "slug",
  // netlify/server related options:
  hasSplatRedirects: true
};
/**
 * @type {GatsbyI18n.Config}
 */

var defaultConfig = {
  baseUrl: "",
  locales: ["en"],
  defaultLocale: "en",
  // enforceLocalisedUrls: false,
  hideDefaultLocaleInUrl: true
};
/**
 * Get options with defaults
 *
 * @param {Partial<GatsbyI18n.Options>} custom
 * @returns {GatsbyI18n.Options}
 */

var getOptions = function getOptions(custom) {
  if (custom === void 0) {
    custom = {};
  }

  return (0, _extends2.default)({}, defaultOptions, custom);
};
/**
 * Get configuration with defaults
 *
 * @param {Partial<GatsbyI18n.Config>} custom
 * @returns {GatsbyI18n.Config}
 */


var getConfig = function getConfig(custom) {
  if (custom === void 0) {
    custom = {};
  }

  return (0, _extends2.default)({}, defaultConfig, custom);
};

module.exports = {
  getOptions: getOptions,
  getConfig: getConfig
};