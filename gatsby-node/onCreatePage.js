var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

// @ts-check
var _require = require("../utils"),
    logger = _require.logger,
    normaliseUrlPath = _require.normaliseUrlPath,
    normaliseRouteId = _require.normaliseRouteId;

var _require2 = require("../utils/internal"),
    getI18nOptions = _require2.getI18nOptions,
    getI18nConfig = _require2.getI18nConfig,
    getTemplateBasename = _require2.getTemplateBasename,
    addI18nRoutesMappings = _require2.addI18nRoutesMappings,
    shouldCreateLocalisedPage = _require2.shouldCreateLocalisedPage,
    getPage = _require2.getPage,
    reorderLocales = _require2.reorderLocales;
/**
 * Here we should create tha same context that we do on `createPages`, it would
 * be better to just create it once here but there is an issue with gatsby that
 * programmatically created pages do not trigger the `onCreatePage` hook,
 * @see https://github.com/gatsbyjs/gatsby/issues/5255
 *
 * The Gatsby docs says in fact: "There is a mechanism in Gatsby to prevent
 * calling onCreatePage for pages created by the same gatsby-node.js to avoid
 * infinite loops/callback."
 *
 * @see https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onCreatePage
 *
 * This function will be implemented by your project,
 * in your `gatsby-node.js`:
 *
 * ```
 * const { onCreatePage } = require("@kuus/gatsby-plugin-i18n/onCreatePage");
 *
 * exports.onCreatePage = ({ page, actions }) => {
 *   onCreatePage({ page, actions });
 * };
 * ```
 */


var onCreatePage = function onCreatePage(_ref) {
  var page = _ref.page,
      actions = _ref.actions;
  var createPage = actions.createPage,
      createRedirect = actions.createRedirect,
      deletePage = actions.deletePage;
  var options = getI18nOptions();
  var config = getI18nConfig();
  var templateName = options.templateName,
      excludePaths = options.excludePaths;
  var locales = config.locales;
  var normalisedExcludedPaths = excludePaths.map(normaliseUrlPath);
  var oldPage = (0, _extends2.default)({}, page);
  var templateBasename = getTemplateBasename(templateName);

  if (page.path.endsWith("/" + templateBasename + "/")) {
    // console.log(`"onCreatePage" page template "${templateBasename}" deleted`);
    deletePage(oldPage); // createPage(page);
  } else if (page.path.match(/dev-404/)) {// console.log(`"onCreatePage" matched dev-404: ${page.path}`);
    // createPage(page);
  } else if (page.path.endsWith("404.html")) {
    // console.log(`"onCreatePage" matched 404.html: ${page.path}`);
    deletePage(oldPage); // create a 404.html fallback page with default language, anyway with netlify
    // redirects the localised version of the 404 page with a pretty URL should
    // be used by the condition here below

    createPage(getPage(page, config.defaultLocale, "/404.html"));
  } else if (page.path === "/404/") {
    // console.log(`"onCreatePage" matched 404: ${page.path}`);
    deletePage(oldPage);
    var sortedLocales = reorderLocales(config);
    var routesMap =
    /** @type {GatsbyI18n.RoutesMap} */
    {};
    var routeId = normaliseRouteId(page.path);
    sortedLocales.forEach(function (locale) {
      var withLocale = normaliseUrlPath("/" + locale + "/404");
      var withoutLocale = normaliseUrlPath("/404");
      var visibleLocale = shouldCreateLocalisedPage(config, locale);
      var path = visibleLocale ? withLocale : withoutLocale;
      routesMap[routeId] = routesMap[routeId] || {};
      routesMap[routeId][locale] = path;
      createPage(getPage(page, locale, path));

      if (!options.hasSplatRedirects && locale === config.defaultLocale) {
        createRedirect({
          fromPath: visibleLocale ? withoutLocale : withLocale,
          toPath: visibleLocale ? withLocale : withoutLocale,
          isPermanent: true
        });
      } // with netlify redirects we can localise 404 pages, @see
      // https://docs.netlify.com/routing/redirects/redirect-options/#custom-404-page-handling
      // this is done automatically by using the matchPath 5th argument to the
      // function `getPage`, we don't do it though, as the redirect automatically
      // created has a 200 instead of a 404 statusCode


      createRedirect({
        fromPath: visibleLocale ? "/" + locale + "/*" : "/*",
        toPath: visibleLocale ? "/" + locale + "/404/index.html" : "/404/index.html",
        statusCode: 404
      });
    });
    addI18nRoutesMappings(routesMap);
  } else {
    // add routes only for pages that loosely placed as `.js/.tsx` files in
    // `src/pages`. For these pages we automatically create the needed localised
    // urls keeping the same slug as the file name (which is what Gatsby uses
    // by default) and the localisation is delegated to the project creator who
    // should use the useIntl hook and define the translations in the
    // `src/content/settings/i18n/$locale.yml` files.
    // For the pages not created this way but instead programmatically created
    // in the `createPages` of your project you need instead to manually
    // create the route object and add it through `gatsby-i18n` API
    // `addI18nRoutesMappings`.
    if (page.isCreatedByStatefulCreatePages) {
      if (normalisedExcludedPaths.includes(normaliseUrlPath(page.path))) {
        if (options.debug) {
          logger("info", "\"onCreatePage\" matched path to exclude from localisation: " + page.path);
        }
      } else {
        if (options.debug) {
          logger("info", "Page \"" + page.path + "\" is deleted in the hook \"onCreatePage\" and localised");
        } // first always delete


        deletePage(oldPage);
        var _routesMap =
        /** @type {GatsbyI18n.RoutesMap} */
        {};

        var _routeId = normaliseRouteId(page.path); // then produce the localised pages according to the current i18n options


        locales.forEach(function (locale) {
          var withLocale = normaliseUrlPath("/" + locale + "/" + page.path);
          var withoutLocale = normaliseUrlPath("/" + page.path);
          var visibleLocale = shouldCreateLocalisedPage(config, locale);
          var path = visibleLocale ? withLocale : withoutLocale;
          _routesMap[_routeId] = _routesMap[_routeId] || {};
          _routesMap[_routeId][locale] = path;
          createPage(getPage(page, locale, path));

          if (!options.hasSplatRedirects && locale === config.defaultLocale) {
            createRedirect({
              fromPath: visibleLocale ? withoutLocale : withLocale,
              toPath: visibleLocale ? withLocale : withoutLocale,
              isPermanent: true
            });
          }
        });
        addI18nRoutesMappings(_routesMap);
      }
    }
  }
};

module.exports = onCreatePage;