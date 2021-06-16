// @ts-check

const { normaliseUrlPath, shouldCreateLocalisedPage } = require("../utils");
const {
  writeI18nOptions,
  ensureI18nConfig,
  ensureLocalisedMessagesFiles,
  getI18nConfig,
  cleanI18nRoutes,
} = require("../utils/internal");
const { getOptions } = require("../utils/options");

const onPreBootstrap = ({ store, actions }, customOptions) => {
  const { program } = store.getState();
  const options = getOptions(customOptions);

  writeI18nOptions(options);
  ensureI18nConfig(program.directory);

  const i18n = getI18nConfig();

  ensureLocalisedMessagesFiles(i18n, options);
  cleanI18nRoutes();

  const { createRedirect } = actions;

  i18n.locales.forEach((locale) => {
    const visibleLocale = shouldCreateLocalisedPage(i18n, locale);

    // create root redirects for netlify, create these here onPreBootstrap as
    // netlify redirects priority is top to bottom, what is read first acts
    // first @see https://bit.ly/3ePMNYC
    // we should end up with e.g. (if `defaultLocale` is "en"):
    // / /en/ 301 (if `hideDefaultLocaleInUrl` is false)
    // /en / 301 (if `hideDefaultLocaleInUrl` is true)
    // / /it/ 301 Language=it
    // / /nl/ 301 Language=nl
    if (visibleLocale) {
      createRedirect({
        fromPath: visibleLocale ? "/" : normaliseUrlPath(`/${locale}`),
        toPath: visibleLocale ? normaliseUrlPath(`/${locale}`) : "/",
        isPermanent: true,
        Language: locale,
      });
    }
  });
};

module.exports = onPreBootstrap;
