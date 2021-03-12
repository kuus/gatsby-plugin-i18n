// @ts-check

const defaultOptions = {
  debug: false,
  baseUrl: "",
  locales: ["en"],
  defaultLocale: "en",
  enforceLocalisedUrls: true,
  hideDefaultLocaleInUrl: false,
  pathData: "src/content/settings/i18n",
  pathContent: ["src/content"],
  excludePaths: ["admin"],
  redirect: true,
  redirectComponent: null,
  templateName: "tpl.tsx",
  untranslatedComponent: null,
  useMdx: true,
  frontmatterKeyForLocalisedSlug: "slug",
};

const getOptions = (pluginOptions = {}) => ({
  ...defaultOptions,
  ...pluginOptions,
});

module.exports = {
  getOptions,
};
