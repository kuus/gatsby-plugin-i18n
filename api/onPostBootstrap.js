// @ts-check

const {
  getI18nConfig,
  shouldCreateLocalisedPage,
  getI18nOptions,
} = require("../utils/internal");

const onPostBootstrap = ({ actions }) => {
  const { createRedirect } = actions;
  const options = getI18nOptions();
  const config = getI18nConfig();

  // create these redirects for netlify:
  // @see https://answers.netlify.com/t/custom-localised-404-page-not-working/8842
  if (options.hasSplatRedirects) {
    config.locales.forEach((locale) => {
      const visibleLocale = shouldCreateLocalisedPage(config, locale);

      const redirect = {
        fromPath: visibleLocale ? "/*" : `/${locale}/*`,
        toPath: visibleLocale ? `/${locale}/:splat` : "/:splat",
        isPermanent: true,
      };
      // only non-default locales get the Language option as the default does
      // not need it, request should by default follow the default localised
      // urls, either if they have visible locale or not (that is determined
      // according to the option `hideDefaultLocaleInUrl`)
      if (locale !== config.defaultLocale) {
        redirect.Language = locale;
      }

      createRedirect(redirect);
    });
  }
};

module.exports = onPostBootstrap;
