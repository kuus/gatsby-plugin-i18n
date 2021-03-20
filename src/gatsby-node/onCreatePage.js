// @ts-check

const { logger, normaliseUrlPath, normaliseRouteId } = require("../utils");
const {
  getI18nOptions,
  getI18nConfig,
  getTemplateBasename,
  addI18nRoutesMappings,
  shouldCreateLocalisedPage,
  getPage,
  reorderLocales,
} = require("../utils/internal");

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
const onCreatePage = ({ page, actions }) => {
  const { createPage, createRedirect, deletePage } = actions;
  const options = getI18nOptions();
  const config = getI18nConfig();
  const { templateName, excludePaths } = options;
  const { locales } = config;
  const normalisedExcludedPaths = excludePaths.map(normaliseUrlPath);
  const oldPage = { ...page };
  const templateBasename = getTemplateBasename(templateName);

  if (page.path.endsWith(`/${templateBasename}/`)) {
    // console.log(`"onCreatePage" page template "${templateBasename}" deleted`);
    deletePage(oldPage);
    // createPage(page);
  } else if (page.path.match(/dev-404/)) {
    // console.log(`"onCreatePage" matched dev-404: ${page.path}`);
    // createPage(page);
  } else if (page.path.endsWith("404.html")) {
    // console.log(`"onCreatePage" matched 404.html: ${page.path}`);
    deletePage(oldPage);
    // create a 404.html fallback page with default language, anyway with netlify
    // redirects the localised version of the 404 page with a pretty URL should
    // be used by the condition here below
    createPage(getPage(page, config.defaultLocale, "/404.html"));
  } else if (page.path === "/404/") {
    // console.log(`"onCreatePage" matched 404: ${page.path}`);
    deletePage(oldPage);

    const sortedLocales = reorderLocales(config);
    const routesMap = /** @type {GatsbyI18n.RoutesMap} */ ({});
    const routeId = normaliseRouteId(page.path);

    sortedLocales.forEach((locale) => {
      const withLocale = normaliseUrlPath(`/${locale}/404`);
      const withoutLocale = normaliseUrlPath("/404");
      const visibleLocale = shouldCreateLocalisedPage(config, locale);
      const path = visibleLocale ? withLocale : withoutLocale;

      routesMap[routeId] = routesMap[routeId] || {};
      routesMap[routeId][locale] = path;

      createPage(getPage(page, locale, path));

      if (!options.hasSplatRedirects && locale === config.defaultLocale) {
        createRedirect({
          fromPath: visibleLocale ? withoutLocale : withLocale,
          toPath: visibleLocale ? withLocale : withoutLocale,
          isPermanent: true,
        });
      }

      // with netlify redirects we can localise 404 pages, @see
      // https://docs.netlify.com/routing/redirects/redirect-options/#custom-404-page-handling
      // this is done automatically by using the matchPath 5th argument to the
      // function `getPage`, we don't do it though, as the redirect automatically
      // created has a 200 instead of a 404 statusCode
      createRedirect({
        fromPath: visibleLocale ? `/${locale}/*` : "/*",
        toPath: visibleLocale ? `/${locale}/404/index.html` : "/404/index.html",
        statusCode: 404,
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
          logger(
            "info",
            `"onCreatePage" matched path to exclude from localisation: ${page.path}`
          );
        }
      } else {
        if (options.debug) {
          logger(
            "info",
            `Page "${page.path}" is deleted in the hook "onCreatePage" and localised`
          );
        }

        // first always delete
        deletePage(oldPage);

        const routesMap = /** @type {GatsbyI18n.RoutesMap} */ ({});
        const routeId = normaliseRouteId(page.path);

        // then produce the localised pages according to the current i18n options
        locales.forEach((locale) => {
          const withLocale = normaliseUrlPath(`/${locale}/${page.path}`);
          const withoutLocale = normaliseUrlPath(`/${page.path}`);
          const visibleLocale = shouldCreateLocalisedPage(config, locale);
          const path = visibleLocale ? withLocale : withoutLocale;

          routesMap[routeId] = routesMap[routeId] || {};
          routesMap[routeId][locale] = path;

          createPage(getPage(page, locale, path));

          if (!options.hasSplatRedirects && locale === config.defaultLocale) {
            createRedirect({
              fromPath: visibleLocale ? withoutLocale : withLocale,
              toPath: visibleLocale ? withLocale : withoutLocale,
              isPermanent: true,
            });
          }
        });

        addI18nRoutesMappings(routesMap);
      }
    }
  }
};

module.exports = onCreatePage;
