// @ts-check

const { getOptions } = require("../utils/options");
const { logger } = require("../utils");
const {
  getI18nContext,
  getI18nConfig,
  relocaliseUrl,
  writeI18nRoutes,
} = require("../utils/internal");

/**
 * @typedef {object} I18nRoutNode
 * @property {string} routeId
 * @property {{ "identifier"?: string; }} context
 * @property {Record<string, I18nRoutNodeFieldLocale>} fields
 *
 * @typedef {object} I18nRoutNodeFieldLocale
 * @property {string} [nodeId]
 * @property {string} locale
 * @property {string} url
 * @property {string} component
 *
 * @typedef {{
 *  [key: string]: {
 *    context: object;
 *    locales: {
 *      [key: string]: I18nRoutNodeFieldLocale & {
 *        translatedIn?: {
 *          locale: string;
 *          url: string;
 *        }[];
 *        robots?: string;
 *        [key: string]: any;
 *      }
 *    }
 *  }
 * }} I18nRoutesAll
 *
 * @typedef {{
 *  [locale: string]: {
 *    [routeId: string]: string;
 *  }
 * }} I18nRoutesKnown
 */

/**
 * @type {import("gatsby").GatsbyNode["createPages"]}
 */
const createPages = async ({ graphql, actions }, pluginOptions) => {
  const { createPage } = actions;
  // @ts-expect-error
  let { baseUrl, debug, untranslatedComponent } = getOptions(pluginOptions);
  const i18n = getI18nConfig();
  const result = await graphql(`
    query {
      allI18NRoute {
        nodes {
          routeId
          context {
            identifier
          }
          fields {
            ${i18n.locales.map(
              (locale) => `
            ${locale} {
              nodeId
              locale
              url
              component
            }
            `
            )}
          }
        }
      }
    }
  `);

  // get baseUrl to construct alternates SEO friendly links, remove trailing
  // slash as routes urls will always have it
  baseUrl = baseUrl.replace(/\/+$/, "");
  const routesNodes = result.data.allI18NRoute.nodes;
  const routesAll = /** @type {I18nRoutesAll} */ ({});
  const routesKnown = /** @type {I18nRoutesKnown} */ ({});

  // Pass 1: register all markdown and file routes that will become pages
  routesNodes.forEach((/** @type {I18nRoutNode} */ node) => {
    const { routeId, context, fields: localesData } = node;
    const availableLocalesData = [];
    routesAll[routeId] = {
      context,
      locales: {},
    };

    // each fields key represent a locale, we do this in the `onCreateNode`
    // because we cannot extend an already created field hence we just create a
    // new node field for each locale on the I18nRoute node
    for (const locale in localesData) {
      const localeData = localesData[locale];

      // a markdown page might not have its translated content, we do it below
      // with the `untranslatedComponent` if set
      if (localeData) {
        availableLocalesData.push(localeData);
        routesAll[routeId].locales[locale] = localeData;

        routesKnown[locale] = routesKnown[locale] || {};
        routesKnown[locale][routeId] = localeData.url;
      }
    }

    // if an `untranslatedComponent` option is set and the translated versions
    // are less then the configured set of locales add some untranslated SEO
    // friendly pages
    const availableLocales = Object.keys(routesAll[routeId].locales);
    if (
      untranslatedComponent &&
      availableLocales.length < i18n.locales.length
    ) {
      const missingLocales = i18n.locales.filter(
        (locale) => !availableLocales.includes(locale)
      );

      missingLocales.forEach((locale) => {
        // now we need to determine the url path of the untranslated route
        // if it exists try using the url assigned to the default locale
        // otherwise the first available localised url, otherwise just use the
        // `routeId` which is also a valid url slug
        let urlToRelocalise = routeId;
        const defaultRoute = routesAll[routeId].locales[i18n.defaultLocale];
        const firstAvailableRoute =
          routesAll[routeId].locales[availableLocales[0]];
        if (defaultRoute && defaultRoute.url) {
          urlToRelocalise = defaultRoute.url;
        } else if (firstAvailableRoute && firstAvailableRoute.url) {
          urlToRelocalise = firstAvailableRoute.url;
        }
        const url = relocaliseUrl(i18n, locale, urlToRelocalise);
        const translatedIn = availableLocales.map((locale) => ({
          locale,
          url: routesAll[routeId].locales[locale].url,
        }));
        const missingLocaleData = {
          nodeId: null, // there is no `id` here, no node "tight" to this page
          locale,
          url,
          component: untranslatedComponent,
          translatedIn,
          // create page for untranslated content
          // FIXME: prevent robots to crawl this page, probably use the
          // `context.robots` in the `gatsby-plugin-sitemap` option query as in
          // https://github.com/gatsbyjs/gatsby/issues/18896
          robots: "noindex,nofollow",
        };

        routesAll[routeId].locales[locale] = missingLocaleData;
      });
    }
  });

  // register on cache for dinamically localised links
  // write localised context to cache so that it can be used by projects to
  // create additional i18n pages within their gatsby-node `createPages`
  writeI18nRoutes(routesKnown);

  // Pass 2: now actually create the pages, the ones tight to File nodes will be
  // deleted from the standard createStatefulPages lifecycle in `onCreatePage`
  for (const routeId in routesAll) {
    const route = routesAll[routeId];
    const alternates = Object.keys(route.locales).map((locale) => ({
      locale,
      url: route[locale].url,
      fullUrl: baseUrl + route[locale].url,
    }));

    for (const locale in route.locales) {
      const { url, component, nodeId: id, ...rest } = route.locales[locale];
      const additionalI18nContext = { ...rest, alternates };

      if (debug) {
        logger("info", `(createPages) create page for url: ${url}`);
      }

      // create page with right URLs
      createPage({
        path: url,
        matchPath: url,
        component,
        context: {
          id,
          locale,
          ...route.context,
          ...getI18nContext(locale, additionalI18nContext),
        },
      });
    }
  }
};

module.exports = createPages;
