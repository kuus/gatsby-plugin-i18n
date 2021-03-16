const {
  writeI18nOptions,
  ensureLocalisedMessagesFiles,
  cleanI18nRoutesMap,
  shouldCreateLocalisedPage,
} = require("./utils-plugin");
const { getOptions } = require("./options");

const onPreBootstrap = ({ actions }, pluginOptions) => {
  writeI18nOptions(pluginOptions);
  ensureLocalisedMessagesFiles(pluginOptions);
  cleanI18nRoutesMap();
  
  const { createRedirect } = actions;
  const options = getOptions(pluginOptions);

  // create these redirects for netlify, create these here onPreBootstrap as
  // netlify redirects priority is top to bottom, what is read first acts first.
  // @see https://answers.netlify.com/t/do-language-based-redirects-take-into-account-browsers-language/2577/13
  // we should end up with e.g.:
  // / /en/ 301
  // / /it/ 301 Language=it
  // / /nl/ 301 Language=nl
  options.locales.forEach((locale) => {
    const visibleLocale = shouldCreateLocalisedPage(options, locale);

    if (visibleLocale) {
      const redirect = {
        fromPath: "/",
        toPath: `/${locale}/`,
        isPermanent: true,
        Language: locale
      };

      createRedirect(redirect);
    }
  });
};

module.exports = onPreBootstrap;
