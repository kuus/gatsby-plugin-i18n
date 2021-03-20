// @ts-check
var _require = require("../utils/internal"),
    getI18nConfig = _require.getI18nConfig,
    shouldCreateLocalisedPage = _require.shouldCreateLocalisedPage,
    getI18nOptions = _require.getI18nOptions;

var onPostBootstrap = function onPostBootstrap(_ref) {
  var actions = _ref.actions;
  var createRedirect = actions.createRedirect;
  var options = getI18nOptions();
  var config = getI18nConfig(); // create these redirects for netlify:
  // @see https://answers.netlify.com/t/custom-localised-404-page-not-working/8842

  if (options.hasSplatRedirects) {
    config.locales.forEach(function (locale) {
      var visibleLocale = shouldCreateLocalisedPage(config, locale);
      var redirect = {
        fromPath: visibleLocale ? "/*" : "/" + locale + "/*",
        toPath: visibleLocale ? "/" + locale + "/:splat" : "/:splat",
        isPermanent: true
      }; // only non-default locales get the Language option as the default does
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