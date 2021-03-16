// @ts-check

const defaultOptions = {
  debug: false,
  baseUrl: "",
  locales: ["en"],
  defaultLocale: "en",
  // enforceLocalisedUrls: false,
  hideDefaultLocaleInUrl: true,
  pathData: "src/content/settings/i18n",
  pathContent: ["src/content"],
  excludePaths: ["admin"],
  templateName: "tpl.tsx",
  untranslatedComponent: null,
  useMdx: true,
  frontmatterKeyForLocalisedSlug: "slug",
  // netlify/server related options:
  hasSplatsRedirect: true
};

const getOptions = (pluginOptions = {}) => ({
  ...defaultOptions,
  ...pluginOptions,
});

module.exports = {
  getOptions,
};
