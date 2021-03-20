// @ts-check

const { normaliseUrlPath } = require("../utils");
const {
  writeI18nOptions,
  ensureI18nConfig,
  ensureLocalisedMessagesFiles,
  getI18nConfig,
  cleanI18nRoutesMap,
  shouldCreateLocalisedPage,
} = require("../utils/internal");

const onPreBootstrap = ({ store, actions }, customOptions) => {
  const { program } = store.getState();

  writeI18nOptions(customOptions);
  ensureI18nConfig(program.directory);
  ensureLocalisedMessagesFiles();
  cleanI18nRoutesMap();

  const { createRedirect } = actions;
  const config = getI18nConfig();

  config.locales.forEach((locale) => {
    const visibleLocale = shouldCreateLocalisedPage(config, locale);

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
