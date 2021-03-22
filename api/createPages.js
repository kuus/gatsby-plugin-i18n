// @ts-check

const path = require("path");
const fs = require("fs");
const { getOptions } = require("../utils/options");
const { logger } = require("../utils");
const {
  getPageContextData,
  addI18nRoutesMappings,
  getUrlData,
  getI18nConfig,
} = require("../utils/internal");

/**
 * @param {GatsbyI18n.Options} options
 * @param {any} node
 * @returns {string}
 */
const getPageComponent = (options, node) => {
  const { templateName } = options;
  const defaultDir = "src/templates";
  const relativeDir = path.dirname(node.fileAbsolutePath);
  let component;

  if (node.frontmatter.template) {
    // TODO: js/ts format support
    component = path.resolve(defaultDir, `${node.frontmatter.template}.tsx`);
  } else {
    component = path.resolve(relativeDir, templateName);
    

    if (!fs.existsSync(component)) {
      if (templateName) {
        logger(
          "info",
          `You can create a file "${templateName}" in the folder` +
            ` "${relativeDir}" instead of declaring it explicitly in the` +
            ` frontmatter section of the page.`
        );
      }
    }
  }

  if (!fs.existsSync(component)) {
    logger("warn", `No template component found for ${node.fileAbsolutePath}`);
  }

  return component;
};

const createPages = async ({ graphql, actions }, pluginOptions) => {
  const { createPage, createRedirect } = actions;
  const options = getOptions(pluginOptions);
  const config = getI18nConfig();
  const { contentPaths } = options;

  let contentPathReg = "";
  if (Array.isArray(contentPaths)) {
    contentPathReg = `(${contentPaths.join("|")})`;
  } else {
    contentPathReg = contentPaths;
  }

  const result = await graphql(`
    query {
      allMarkdown: ${options.useMdx ? "allMdx" : "allMarkdownRemark"}(
        filter: {
          fileAbsolutePath: {regex: "${new RegExp(contentPathReg)}"},
          fields: { route: { ne: null } }
        }
      ) {
        nodes {
          url
          fileAbsolutePath
          fields {
            route
            locale
            slug
          }
          frontmatter {
            template
          #  draft
          #  hidden
          }
        }
      }
    }
  `);

  const markdownPages = result.data.allMarkdown.nodes;
  const routesMap = /** @type {GatsbyI18n.RoutesMap} */ ({});

  // create all markdown pages, the file ones, instead, are handled by gatsby
  // through the createStatefulPages lifecycle and are therefore just treated in
  // the `onCreatePage` of the specific project using this plugin
  markdownPages.forEach((node) => {
    const {
      fields: { locale, slug, route: routeId },
    } = node;
    const { url, urlWithLocale, urlWithoutLocale, isLocaleVisible } = getUrlData(
      config,
      locale,
      slug
    );
    const component = getPageComponent(options, node);
    // we use `url` instead of `id` in the page queries to render a single
    // localised page, as the above untranslated components do not have a known
    // `id` to use at this point. The `url`s are unique as well anyway.
    const context = { url, locale };

    if (options.debug) {
      logger("info", `createPages: create md pages for slug: ${slug}`);
    }

    // create page with right URLs
    createPage({
      path: url,
      matchPath: url,
      component,
      context: {
        ...context,
        ...getPageContextData(locale),
      },
    });

    // always create redirects for the default locale either one way or the
    // other (with->without or without->with)
    if (!options.hasSplatRedirects && locale === config.defaultLocale) {
      createRedirect({
        fromPath: isLocaleVisible ? urlWithoutLocale : urlWithLocale,
        toPath: isLocaleVisible ? urlWithLocale : urlWithoutLocale,
        isPermanent: true,
      });
    }

    // add to routes map
    routesMap[routeId] = routesMap[routeId] || {};
    routesMap[routeId][locale] = url;
  });

  // add fallback page for untranslated routes
  if (options.untranslatedComponent) {
    for (const routeId in routesMap) {
      const routeData = routesMap[routeId];
      const existingLocalisedRoutes = Object.keys(routeData);

      // if the translated versions are less then the default set of locales
      // create some untranslated pages
      if (existingLocalisedRoutes.length < config.locales.length) {
        config.locales.forEach((locale) => {
          // bail if the route is already there
          if (routeData[locale]) return;

          // now we need to determine the url path of the untranslated route
          // if it exists try using the url assigned to the default locale
          // otherwise just use the routeId which is also a valid url slug
          const slug = routeData[config.defaultLocale] || routeId;
          const { url } = getUrlData(config, locale, slug);
          const context = { url, locale };

          // add the "untranslated" route to the routes map too
          routesMap[routeId][locale] = url;

          const availableIn = existingLocalisedRoutes.map((locale) => ({
            locale,
            to: routesMap[routeId][locale],
          }));

          // create page for untranslated content
          // FIXME: prevent robots to crawl this page, probably use the
          // `context.robots` in the `gatsby-plugin-sitemap` option query as in
          // https://github.com/gatsbyjs/gatsby/issues/18896
          createPage({
            path: url,
            matchPath: url,
            component: options.untranslatedComponent,
            context: {
              ...context,
              robots: "noindex,nofollow",
              ...getPageContextData(locale, { availableIn }),
            },
          });
        });
      }
    }
  }

  addI18nRoutesMappings(routesMap);
};

module.exports = createPages;
