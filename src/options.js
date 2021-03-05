const defaultOptions = {
  baseUrl: "",
  locales: ["en"],
  defaultLocale: "en",
  enforceLocalisedUrls: true,
  hideDefaultLocaleInUrl: false,
  pathData: "src/content/settings/i18n",
  pathContent: [/* "src/pages",  */ "src/content"], // TODO: docs, the order matters..
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
