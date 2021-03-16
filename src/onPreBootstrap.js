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
  //
  // create these redirects for netlify:
  // @see https://answers.netlify.com/t/custom-localised-404-page-not-working/8842
  options.locales.forEach((locale) => {
    const visibleLocale = shouldCreateLocalisedPage(options, locale);

    if (visibleLocale) {
      const redirectRoot = {
        fromPath: "/",
        toPath: `/${locale}/`,
        isPermanent: true,
        Language: locale,
      };
      
      createRedirect(redirectRoot);
    }

    if (visibleLocale) {
      const redirectAll = {
        fromPath: "/*",
        toPath: `/${locale}/:splat`,
        isPermanent: true,
      };
      // only non-default locales get the Language option as the default does 
      // not need it, request should by default follow the default localised
      // urls, either if they have visible locale or not (according to the
      // option `hideDefaultLocaleInUrl`)
      if (locale !== options.defaultLocale) {
        redirectAll.Language = locale;
      }

      createRedirect(redirectAll);
    }
  });
};

module.exports = onPreBootstrap;
