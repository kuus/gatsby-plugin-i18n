// @ts-check

const { getOptions } = require("../utils/options");
const { shouldCreateLocalisedPage } = require("../utils");
const { getI18nConfig, reorderLocales } = require("../utils/internal");

const onPostBootstrap = ({ actions }, pluginOptions) => {
  const { createRedirect } = actions;
  const options = getOptions(pluginOptions);
  const i18n = getI18nConfig();

  // create these redirects for netlify:
  // @see https://answers.netlify.com/t/custom-localised-404-page-not-working/8842
  if (options.hasSplatRedirects) {
    i18n.locales.forEach((locale) => {
      const visibleLocale = shouldCreateLocalisedPage(i18n, locale);

      const redirect = {
        fromPath: visibleLocale ? "/*" : `/${locale}/*`,
        toPath: visibleLocale ? `/${locale}/:splat` : "/:splat",
        isPermanent: true,
      };
      // only non-default locales get the Language option as the default does
      // not need it, request should by default follow the default localised
      // urls, either if they have visible locale or not (that is determined
      // according to the option `hideDefaultLocaleInUrl`)
      if (locale !== i18n.defaultLocale) {
        redirect.Language = locale;
      }

      createRedirect(redirect);
    });
  }

  // with netlify redirects we can localise 404 pages, @see
  // https://docs.netlify.com/routing/redirects/redirect-options/#custom-404-page-handling
  // this could be done automatically by using the `matchPath` 4th
  // argument to the function `getPage`, we don't do it though, as the
  // redirect automatically created has a 200 instead of a 404
  // statusCode, hence we "manually" create the right redirect here.
  // we sort the locales here in order to get the right priorities in
  // the netlify `_redirects` file
  const sortedLocales = reorderLocales(i18n);

  sortedLocales.forEach((locale) => {
    const isLocaleVisible = shouldCreateLocalisedPage(i18n, locale);

    createRedirect({
      fromPath: isLocaleVisible ? `/${locale}/*` : "/*",
      toPath: isLocaleVisible ? `/${locale}/404/index.html` : "/404/index.html",
      statusCode: 404,
    });
  });
};

module.exports = onPostBootstrap;
