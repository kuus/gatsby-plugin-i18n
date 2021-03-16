// @ts-check

const { getOptions } = require("./options");
const { shouldCreateLocalisedPage } = require("./utils-plugin");

const onPostBootstrap = ({ actions }, pluginOptions) => {
  const { createRedirect } = actions;
  const options = getOptions(pluginOptions);

  // create these redirects for netlify:
  // @see https://answers.netlify.com/t/custom-localised-404-page-not-working/8842
  options.locales.forEach((locale) => {
    const visibleLocale = shouldCreateLocalisedPage(options, locale);

    if (visibleLocale) {
      const redirect = {
        fromPath: "/*",
        toPath: `/${locale}/:splat`,
        isPermanent: true,
        force: true
      };
      if (locale !== options.defaultLocale) {
        redirect.Language = locale;
      }

      createRedirect(redirect);
    }
  });
};

module.exports = onPostBootstrap;
