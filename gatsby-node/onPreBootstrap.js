// @ts-check
var _require = require("../utils"),
    normaliseUrlPath = _require.normaliseUrlPath;

var _require2 = require("../utils/internal"),
    writeI18nOptions = _require2.writeI18nOptions,
    ensureI18nConfig = _require2.ensureI18nConfig,
    ensureLocalisedMessagesFiles = _require2.ensureLocalisedMessagesFiles,
    getI18nConfig = _require2.getI18nConfig,
    cleanI18nRoutesMap = _require2.cleanI18nRoutesMap,
    shouldCreateLocalisedPage = _require2.shouldCreateLocalisedPage;

var onPreBootstrap = function onPreBootstrap(_ref, customOptions) {
  var store = _ref.store,
      actions = _ref.actions;

  var _store$getState = store.getState(),
      program = _store$getState.program;

  writeI18nOptions(customOptions);
  ensureI18nConfig(program.directory);
  ensureLocalisedMessagesFiles();
  cleanI18nRoutesMap();
  var createRedirect = actions.createRedirect;
  var config = getI18nConfig();
  config.locales.forEach(function (locale) {
    var visibleLocale = shouldCreateLocalisedPage(config, locale); // create root redirects for netlify, create these here onPreBootstrap as
    // netlify redirects priority is top to bottom, what is read first acts
    // first @see https://bit.ly/3ePMNYC
    // we should end up with e.g. (if `defaultLocale` is "en"):
    // / /en/ 301 (if `hideDefaultLocaleInUrl` is false)
    // /en / 301 (if `hideDefaultLocaleInUrl` is true)
    // / /it/ 301 Language=it
    // / /nl/ 301 Language=nl

    createRedirect({
      fromPath: visibleLocale ? "/" : normaliseUrlPath("/" + locale),
      toPath: visibleLocale ? normaliseUrlPath("/" + locale) : "/",
      isPermanent: true,
      Language: locale
    });
  });
};

module.exports = onPreBootstrap;