const nodePath = require("path");
const fs = require("fs");
const { getOptions } = require("./options");
const {
  logger,
  normaliseSlashes,
  getPageContextData,
  getTemplateBasename,
  addRoutes,
} = require("./utils-plugin");

const getPageComponent = ({ options, node }) => {
  const { pathContent, templateName } = options;
  const { relativePath, frontmatter, fields } = node;
  const { fileDir /* , slug */ } = fields;
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
        // console.log(
        //   `You can create a file "${templateName}" in the folder` +
        //     ` "${componentIdealDir}" instead of declaring it explicitly in the` +
        //     ` frontmatter section of the page ${slug}.`
        // );
      }
      logger(
        "warn",
        `No template component found for ${node.fileAbsolutePath}`
      );
    }
  }

  return component;
};

const createPages = async ({ graphql, actions }, pluginOptions) => {
  const { createPage, createRedirect } = actions;
  const options = getOptions(pluginOptions);
  const {
    enforceLocalisedUrls,
    hideDefaultLocaleInUrl,
    pathContent,
    templateName,
  } = options;

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
      allMarkdown: ${options.useMdx ? "allMdx" : "allMarkdownRemark"} {
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
  const routes = {};

  // build routes map
  allPages.forEach((edge) => {
    const { slug, locale, route } = edge.node.fields;
    // console.log(`slug: ${slug}, locale: ${locale}, route: ${route}`);
    routes[route] = routes[route] || {};
    routes[route][locale] = normaliseSlashes(`/${locale}/${slug}`);
  });

  // add 404 localised routes
  options.locales.forEach((locale) => {
    const path = normaliseSlashes("/404");
    routes[path] = routes[path] || {};
    routes[path][locale] = normaliseSlashes(`/${locale}/404`);
  });

  // add fallback page for untraslated routes
  if (options.untranslatedComponent) {
    for (const route in routes) {
      const routeData = routes[route];
      const routelocales = Object.keys(routeData);

      // if the translated versions are less then the default set of locales
      // create some untranslated pages
      if (routelocales.length < options.locales.length) {
        options.locales.forEach((locale) => {
          // bail if the route is already there
          if (routeData[locale]) return;

          const context = { route, locale };
          // create path and add the "untranslated" route to the route map too
          const routeDefaultPath = routeData[options.defaultLocale];
          // if it ixists use the route's path assigned to the default locale,
          // otheriwse use as path the route key preceded by the current locale
          let path = routeDefaultPath
            ? routeDefaultPath.replace(options.defaultLocale, locale)
            : `${locale}/${route}`;
          // then normalises the URL slashes
          path = normaliseSlashes(path);
          routes[route][locale] = path;

          // create page for untranslated content
          createPage({
            path: path,
            component: options.untranslatedComponent,
            context: {
              ...context,
              ...getPageContextData(
                { options, locale, routed: true },
                {
                  availableIn: routelocales.map((locale) => ({
                    locale,
                    to: routes[route][locale],
                  })),
                }
              ),
            },
          });
        });
      }
    }
  }

  // create all markdown pages
  markdownPages.forEach(({ node }) => {
    const {
      id,
      fields: { route, slug, locale },
    } = node;
    let path = normaliseSlashes(`/${locale}/${slug}`);
    const component = getPageComponent({ options, node });
    const context = { id, route, slug, locale };

    if (options.debug) {
      logger(
        "info",
        `createPages: create md pages for path: ${path}, with slug: ${slug}`
      );
    }

    // create page with localised URL
    if (
      locale !== options.defaultLocale ||
      (locale == options.defaultLocale && enforceLocalisedUrls)
    ) {
      createPage({
        path: path,
        component,
        context: {
          ...context,
          ...getPageContextData({ options, locale, routed: true }),
        },
      });
    }

    // create same page without locale slug in URL for default locale
    // if declared options
    // TODO: maybe instead of this create Netlify `_redirects` file automatically
    if (locale === options.defaultLocale) {
      const pathWithoutLocale = normaliseSlashes(
        slug.replace(`/${options.defaultLocale}`, "")
      );

      if (!enforceLocalisedUrls && hideDefaultLocaleInUrl) {
        createPage({
          path: pathWithoutLocale,
          component,
          context: {
            ...context,
            ...getPageContextData({ options, locale, routed: false }),
          },
        });
      }
      if (enforceLocalisedUrls && !hideDefaultLocaleInUrl) {
        createRedirect({
          fromPath: pathWithoutLocale,
          toPath: path,
          isPermanent: true,
        });
      }
    }
  });

  addRoutes(routes);
};

module.exports = createPages;
