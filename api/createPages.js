// @ts-check

const nodePath = require("path");
const fs = require("fs");
const { getOptions } = require("../utils/options");
const { logger } = require("../utils");
const {
  getPageContextData,
  getTemplateBasename,
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
  const { contentPaths, templateName } = options;
  const { relativePath, frontmatter, fields } = node;
  const { fileDir, slug } = fields;
  const rightContentPath = Array.isArray(contentPaths)
    ? contentPaths[0]
    : contentPaths;
  const componentIdealDir = nodePath.join(rightContentPath, fileDir);
  const componentUsualDir = "src/templates";
  let component;

  if (frontmatter.template) {
    component = nodePath.resolve(
      componentUsualDir,
      `${frontmatter.template}.tsx` // TODO: js/ts format support
    );
  } else if (relativePath) {
    component = nodePath.resolve(rightContentPath, relativePath);
  } else {
    component = nodePath.resolve(componentIdealDir, templateName);

    if (!fs.existsSync(component)) {
      if (templateName) {
        logger(
          "info",
          `You can create a file "${templateName}" in the folder` +
            ` "${componentIdealDir}" instead of declaring it explicitly in the` +
            ` frontmatter section of the page ${slug}.`
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
  const { contentPaths, templateName } = options;

  let rightContentPath = "";
  if (Array.isArray(contentPaths)) {
    rightContentPath = `(${contentPaths.join("|")})`;
  } else {
    rightContentPath = contentPaths;
  }

  const result = await graphql(`
    query {
      allFile(filter: {
        absolutePath: {regex: "${new RegExp(rightContentPath)}"},
        ext: {in: [".js", ".jsx", ".ts", ".tsx"]},
        name: {nin: ["${getTemplateBasename(templateName)}"]}
      }) {
        nodes {
          id
          relativePath
        }
      }
      allMarkdown: ${options.useMdx ? "allMdx" : "allMarkdownRemark"}(
        filter: {
          frontmatter: { template: { ne: null } }
        }
      ) {
        nodes {
          id
          fields {
            slug
            locale
            fileDir
            route
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

  const filePages = result.data.allFile.nodes;
  const markdownPages = result.data.allMarkdown.nodes;
  const allPages = markdownPages.concat(filePages);
  const routesMap = /** @type {GatsbyI18n.RoutesMap} */ ({});

  // build routes map
  allPages.forEach((node) => {
    const { slug, locale, route: routeId } = node.fields;
    const { url } = getUrlData(config, locale, slug);

    routesMap[routeId] = routesMap[routeId] || {};
    routesMap[routeId][locale] = url;
  });

  // add fallback page for untraslated routes
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

  // create all markdown pages, the file ones, instead, are handled by gatsby
  // through the createStatefulPages lifecycle and are therefore just treated in
  // the `onCreatePage` of the specific project using this plugin
  markdownPages.forEach((node) => {
    const {
      id,
      fields: { locale, slug },
    } = node;
    const {
      url,
      urlWithLocale,
      urlWithoutLocale,
      isLocaleVisible,
    } = getUrlData(config, locale, slug);
    const component = getPageComponent(options, node);
    // FIXME: check whether using `id` (not available on untranslated routes above
    // for now) or `slug` in the page queries used to render a single localised
    // page
    const context = { url, locale };

    if (options.debug) {
      logger("info", `createPages: create md pages for slug: ${slug}`);
    }

    // create page with right URLs
    createPage({
      path: url,
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
  });

  addI18nRoutesMappings(routesMap);
};

module.exports = createPages;
