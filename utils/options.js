// @ts-check

/**
 * @type {GatsbyI18n.Options}
 */
const defaultOptions = {
  debug: false,
  // paths
  configPath: "src/content/settings/i18n/config.yml",
  messagesPath: "src/content/settings/i18n/messages",
  contentPaths: ["src/pages", "src/content"],
  // excludePaths: ["admin"],
  excludePaths: [],
  templateName: "tpl.tsx",
  untranslatedComponent: null,
  useMdx: true,
  frontmatterKeyForLocalisedSlug: "slug",
  // netlify/server related options:
  hasSplatRedirects: true,
};

/**
 * @type {GatsbyI18n.Config}
 */
const defaultConfig = {
  baseUrl: "",
  locales: ["en"],
  defaultLocale: "en",
  hideDefaultLocaleInUrl: true,
};

/**
 * Get options with defaults
 *
 * @param {Partial<GatsbyI18n.Options>} custom
 * @returns {GatsbyI18n.Options}
 */
const getOptions = (custom = {}) => ({
  ...defaultOptions,
  ...custom,
});

/**
 * Get configuration with defaults
 *
 * @param {Partial<GatsbyI18n.Config>} custom
 * @returns {GatsbyI18n.Config}
 */
const getConfig = (custom = {}) => ({
  ...defaultConfig,
  ...custom,
});

module.exports = {
  defaultConfig,
  getOptions,
  getConfig,
};
