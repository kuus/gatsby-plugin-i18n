const defaultOptions = {
  baseUrl: "",
  defaultLanguage: "en",
  languages: ["en"],
  // pathData: "src/data/i18n",
  pathContent: [/* "src/pages",  */ "src/content"], // TODO: docs, the order matters..
  redirect: true,
  redirectComponent: null,
  templateName: "tpl.tsx",
  untranslatedComponent: null,
  useMdx: true,
};

const getOptions = (pluginOptions = {}) => ({
  ...defaultOptions,
  ...pluginOptions,
});

module.exports = {
  getOptions,
};
