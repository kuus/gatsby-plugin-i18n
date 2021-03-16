const {
  writeI18nOptions,
  ensureLocalisedMessagesFiles,
  cleanI18nRoutesMap,
  shouldCreateLocalisedPage,
  normaliseUrlPath,
} = require("./utils-plugin");
const { getOptions } = require("./options");

const onPreBootstrap = ({ actions }, pluginOptions) => {
  writeI18nOptions(pluginOptions);
  ensureLocalisedMessagesFiles(pluginOptions);
  cleanI18nRoutesMap();

  const { createRedirect } = actions;
  const options = getOptions(pluginOptions);

  options.locales.forEach((locale) => {
    const visibleLocale = shouldCreateLocalisedPage(options, locale);

    // create root redirects for netlify, create these here onPreBootstrap as
    // netlify redirects priority is top to bottom, what is read first acts
    // first @see https://bit.ly/3ePMNYC
    // we should end up with e.g. (if `defaultLocale` is "en"):
    // / /en/ 301 (if `hideDefaultLocaleInUrl` is false)
    // /en / 301 (if `hideDefaultLocaleInUrl` is true)
    // / /it/ 301 Language=it
    // / /nl/ 301 Language=nl
    createRedirect({
      fromPath: visibleLocale ? "/" : normaliseUrlPath(`/${locale}`),
      toPath: visibleLocale ? normaliseUrlPath(`/${locale}`) : "/",
      isPermanent: true,
      Language: locale,
    });
  });
};

module.exports = onPreBootstrap;
