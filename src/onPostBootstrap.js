// @ts-check

const { getOptions } = require("./options");
const { shouldCreateLocalisedPage } = require("./utils-plugin");

const onPostBootstrap = ({ actions }, pluginOptions) => {
  const { createRedirect } = actions;
  const options = getOptions(pluginOptions);

  // create these redirects for netlify:
  // @see https://answers.netlify.com/t/custom-localised-404-page-not-working/8842
  // FIXME: check that this actually works
  if (options.hasSplatsRedirect) {
    options.locales.forEach((locale) => {
      const visibleLocale = shouldCreateLocalisedPage(options, locale);
  
      const redirect = {
        fromPath: visibleLocale ? "/*" : `/${locale}/*`,
        toPath: visibleLocale ? `/${locale}/:splat` : "/:splat",
        isPermanent: true,
      };
      if (locale !== options.defaultLocale) {
        redirect.Language = locale;
      }

      createRedirect(redirect);
    });
  }
};

module.exports = onPostBootstrap;
