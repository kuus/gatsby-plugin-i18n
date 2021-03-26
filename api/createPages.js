// @ts-check

const { getOptions } = require("../utils/options");
const { logger } = require("../utils");
const {
  getI18nContext,
  getI18nConfig,
  relocaliseUrl,
  registerI18nRouteUrl,
} = require("../utils/internal");

const createPages = async ({ graphql, actions }, pluginOptions) => {
  const { createPage } = actions;
  const { debug, untranslatedComponent } = getOptions(pluginOptions);
  const config = getI18nConfig();
  const result = await graphql(`
    query {
      site {
        siteMetadata {
          siteUrl
        }
      }
      allI18NRoute {
        nodes {
          routeId
          fields {
            ${config.locales.map((locale) => `
            ${locale} {
              nodeId
              locale
              url
              component
            }
            `)}
          }
        }
      }
    }
  `);

  // get baseUrl to construct alternates SEO friendly links, remove trailing
  // slash as routes urls will always have it
  const baseUrl = result.data.site.siteMetadata.siteUrl.replace(/\/+$/, "");
  const routeNodes = result.data.allI18NRoute.nodes;
  const routes = {};

  // Pass 1: register all markdown and file routes that will become pages
  routeNodes.forEach((node) => {
    const { routeId, fields: localesData } = node;
    const availableLocalesData = [];
    routes[routeId] = {}

    // each fields key represent a locale, we do this in the `onCreateNode`
    // because we cannot extend an already created field hence we just create a
    // new node field for each locale on the I18nRoute node
    for (const locale in localesData) {
      const localeData = localesData[locale];

      // a markdown page might not have its translated content, we do it below
      // with the `untranslatedComponent` if set
      if (localeData) {
        availableLocalesData.push(localeData);
        routes[routeId][locale] = localeData;
      }
    }

    // if an `untranslatedComponent` option is set and the translated versions
    // are less then the configured set of locales add some untranslated SEO
    // friendly pages
    const availableLocales = Object.keys(routes[routeId]);
    if (untranslatedComponent && availableLocales.length < config.locales.length) {
      const missingLocales = config.locales.filter(
        (locale) => !availableLocales.includes(locale)
      );

      missingLocales.forEach((locale) => {
        // now we need to determine the url path of the untranslated route
        // if it exists try using the url assigned to the default locale
        // otherwise just use the `routeId` which is also a valid url slug
        const defaultUrl = routes[routeId][config.defaultLocale]?.url;
        const url = relocaliseUrl(config, locale, defaultUrl || routeId);
        const translatedIn = availableLocales.map(locale => ({
          locale,
          url: routes[routeId][locale].url,
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

        routes[routeId][locale] = missingLocaleData;
      });
    }
  });

  // Pass 2: now actually create the pages, the ones tight to File nodes will be
  // deleted from the standard createStatefulPages lifecycle in `onCreatePage`
  for (const routeId in routes) {
    const route = routes[routeId];
    const alternates = Object.keys(route).map(locale => ({
      locale,
      url: route[locale].url,
      fullUrl: baseUrl + route[locale].url,
    }));

    for (const locale in route) {
      const { url, component, nodeId: id, ...rest } = route[locale];
      const additionalI18nContext = { ...rest, alternates };

      if (debug) {
        logger("info", `(createPages) create page for url: ${url}`);
      }

      // register on cache for dinamically localised links
      registerI18nRouteUrl(routeId, locale, url);

      // create page with right URLs
      createPage({
        path: url,
        matchPath: url,
        component,
        context: {
          id,
          locale,
          ...getI18nContext(locale, additionalI18nContext),
        },
      });
    }
  }
};

module.exports = createPages;
