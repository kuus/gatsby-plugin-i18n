// @ts-check

const nodePath = require("path");
const fs = require("fs");
const { getOptions } = require("./options");
const { logger } = require("./utils");
const {
  normaliseUrlPath,
  getPageContextData,
  getTemplateBasename,
  addI18nRoutesMappings,
  shouldCreateLocalisedPage,
} = require("./utils-plugin");

const getPageComponent = ({ options, node }) => {
  const { pathContent, templateName } = options;
  const { relativePath, frontmatter, fields } = node;
  const { fileDir, slug } = fields;
  const rightContentPath = Array.isArray(pathContent)
    ? pathContent[0]
    : pathContent;
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
  const { pathContent, templateName } = options;

  let rightContentPath = "";
  if (Array.isArray(pathContent)) {
    rightContentPath = `(${pathContent.join("|")})`;
  } else {
    rightContentPath = pathContent;
  }

  const result = await graphql(`
    query {
      allFile(filter: {
        absolutePath: {regex: "${new RegExp(rightContentPath)}"},
        ext: {in: [".js", ".jsx", ".ts", ".tsx"]},
        name: {nin: ["${getTemplateBasename(templateName)}", "404"]}
      }) {
        edges {
          node {
            id
            relativePath
            fields {
              slug
              locale
              fileDir
              route
            }
          }
        }
      }
      allMarkdown: ${options.useMdx ? "allMdx" : "allMarkdownRemark"}(
        filter: {
          frontmatter: { template: { ne: null } }
        }
      ) {
        edges {
          node {
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
    }
  `);

  const filePages = result.data.allFile.edges;
  const markdownPages = result.data.allMarkdown.edges;
  const allPages = markdownPages.concat(filePages);
  const routesMap = /** @type {import("./utils-plugin").RoutesMap} */ ({});

  // build routes map
  allPages.forEach((edge) => {
    const { slug, locale, route: routeId } = edge.node.fields;
    const withLocale = normaliseUrlPath(`/${locale}/${slug}`);
    const withoutLocale = normaliseUrlPath(`/${slug}`);
    const visibleLocale = shouldCreateLocalisedPage(options, locale);

    routesMap[routeId] = routesMap[routeId] || {};
    routesMap[routeId][locale] = visibleLocale ? withLocale : withoutLocale;
  });

  // add fallback page for untraslated routes
  if (options.untranslatedComponent) {
    for (const routeId in routesMap) {
      const routeData = routesMap[routeId];
      const routelocales = Object.keys(routeData);

      // if the translated versions are less then the default set of locales
      // create some untranslated pages
      if (routelocales.length < options.locales.length) {
        options.locales.forEach((locale) => {
          // bail if the route is already there
          if (routeData[locale]) return;

          const context = { route: routeId, locale };
          // now we need to determine the url path of the untranslated route
          const routeDefaultPath = routeData[options.defaultLocale];
          // if it exists use the route's path assigned to the default locale,
          // otherwise use as path the route id preceded by the current locale
          let withLocale = routeDefaultPath
            ? routeDefaultPath.replace(options.defaultLocale, locale)
            : `${locale}/${routeId}`;
          // then normalises the URL slashes
          withLocale = normaliseUrlPath(withLocale);

          // add the "untranslated" route to the routes map too
          routesMap[routeId][locale] = withLocale;

          const availableIn = routelocales.map((locale) => ({
            locale,
            to: routesMap[routeId][locale],
          }));

          // create page for untranslated content
          createPage({
            path: withLocale,
            component: options.untranslatedComponent,
            context: {
              ...context,
              ...getPageContextData({ options, locale }, { availableIn }),
            },
          });
        });
      }
    }
  }

  // create all markdown pages, the file ones, instead, are handled by gatsby
  // through the createStatefulPages lifecycle and are therefore just treated in
  // the `onCreatePage` of the specific project using this plugin
  markdownPages.forEach(({ node }) => {
    const {
      id,
      fields: { route: routeId, slug, locale },
    } = node;
    const withLocale = normaliseUrlPath(`/${locale}/${slug}`);
    const withoutLocale = normaliseUrlPath(`/${slug}`);
    const visibleLocale = shouldCreateLocalisedPage(options, locale);
    const component = getPageComponent({ options, node });
    // FIXME: check what we actually need to pass to context
    const context = { id, /* route: routeId, slug, */ locale };

    if (options.debug) {
      logger("info", `createPages: create md pages for slug: ${slug}`);
    }

    // create page with right URLs
    createPage({
      path: visibleLocale ? withLocale : withoutLocale,
      component,
      context: {
        ...context,
        ...getPageContextData({ options, locale }),
      },
    });

    // always create redirects for the default locale either one way or the
    // other (with->without or without->with)
    if (locale === options.defaultLocale) {
      createRedirect({
        fromPath: (visibleLocale ? withoutLocale : withLocale).replace(/\/*$/g, ""),
        toPath: visibleLocale ? withLocale : withoutLocale,
        isPermanent: true,
        force: true,
      });
    }
  });

  addI18nRoutesMappings(routesMap);
};

module.exports = createPages;
