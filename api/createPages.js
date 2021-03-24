// @ts-check

const { getOptions } = require("../utils/options");
const { logger } = require("../utils");
const {
  getPageContextData,
  getI18nConfig,
  relocaliseUrl,
  registerI18nRouteUrl,
} = require("../utils/internal");

const createPages = async ({ graphql, actions }, pluginOptions) => {
  const { createPage } = actions;
  const options = getOptions(pluginOptions);
  const config = getI18nConfig();
  const dynamicFieldsQuery = `
    ${config.locales.map(
      (locale) =>
        `\n${locale} {
      nodeId
      locale
      url
      component
    }\n`
    )}
  `;
  const result = await graphql(`
    query {
      allI18NRoute {
        nodes {
          routeId
          fields {
            ${dynamicFieldsQuery}
          }
        }
      }
    }
  `);

  const routenodes = result.data.allI18NRoute.nodes;

  // create all markdown and file pages, the file ones will be deleted from the
  // standard createStatefulPages lifecycle in `onCreatePage`
  routenodes.forEach((node) => {
    const { routeId, fields: localesData } = node;
    const availableLocalesData = [];

    // each fields key represent a locale, we do this in the `onCreateNode`
    // because we cannot extend an already created field hence we just create a
    // new node field for each locale on the I18nRoute node
    for (const locale in localesData) {
      const localeData = localesData[locale];

      // a markdown page might not have its translated content hence we do not
      // create the page here, but later with the `untranslatedComponent` if set
      if (localeData) {
        availableLocalesData.push(localeData);

        const { url, component, nodeId } = localeData;

        if (options.debug) {
          logger("info", `(createPages) create page for url: ${url}`);
        }

        // create page with right URLs
        // we use `url` instead of `id` in the page queries to render a single
        // localised page, as the below untranslated components do not have a known
        // `id` to use at this point. The `url`s are unique as well anyway.
        createPage({
          path: url,
          matchPath: url,
          component,
          context: {
            id: nodeId,
            locale,
            url,
            ...getPageContextData(locale),
          },
        });
      }
    }

    // if a `untranslatedComponent` option is set and the translated versions
    // are less then the default set of locales create some untranslated SEO
    // friendly pages
    if (
      options.untranslatedComponent &&
      availableLocalesData.length < config.locales.length
    ) {
      const availableLocales = availableLocalesData.map(({ locale }) => locale);
      const missingLocales = config.locales.filter(
        (locale) => !availableLocales.includes(locale)
      );

      if (missingLocales.length) {
        missingLocales.forEach((locale) => {
          // now we need to determine the url path of the untranslated route
          // if it exists try using the url assigned to the default locale
          // otherwise just use the `routeId` which is also a valid url slug
          const defaultLocaleData = availableLocalesData.filter(
            ({ locale }) => locale === config.defaultLocale
          )[0] || { url: routeId };
          const url = relocaliseUrl(config, locale, defaultLocaleData.url);

          const availableIn = availableLocalesData.map(({ locale, url }) => ({
            locale,
            to: url,
          }));

          registerI18nRouteUrl(routeId, locale, url);

          // create page for untranslated content
          // FIXME: prevent robots to crawl this page, probably use the
          // `context.robots` in the `gatsby-plugin-sitemap` option query as in
          // https://github.com/gatsbyjs/gatsby/issues/18896
          createPage({
            path: url,
            matchPath: url,
            component: options.untranslatedComponent,
            context: {
              locale,
              url,
              robots: "noindex,nofollow",
              ...getPageContextData(locale, { availableIn }),
            },
          });
        });
      }
    }
  });
};

module.exports = createPages;
