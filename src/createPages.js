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
  const options = getOptions(pluginOptions);
  const { createPage } = actions;
  let rightContentPath = "";
  if (Array.isArray(options.pathContent)) {
    rightContentPath = `(${options.pathContent.join("|")})`;
  } else {
    rightContentPath = options.pathContent;
  }

  // name: {nin: ["${getTemplateBasename(options.templateName)}", "404"]}
  // name: {ne: "${getTemplateBasename(options.templateName)}"}
  const result = await graphql(`
    query {
      allFile(filter: {
        absolutePath: {regex: "${new RegExp(rightContentPath)}"},
        ext: {in: [".js", ".jsx", ".ts", ".tsx"]},
        name: {nin: ["${getTemplateBasename(options.templateName)}", "404"]}
      }) {
        edges {
          node {
            id
            relativePath
            fields {
              slug
              lang
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
              lang
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
  const { languages, defaultLanguage, untranslatedComponent } = options;

  // build routes map
  allPages.forEach((edge) => {
    const { slug, lang, route } = edge.node.fields;
    // console.log(`slug: ${slug}, lang: ${lang}, route: ${route}`);
    routes[route] = routes[route] || {};
    routes[route][lang] = normaliseSlashes(`/${lang}/${slug}`);
  });

  // add 404 localised routes
  languages.forEach((lang) => {
    const path = normaliseSlashes("/404");
    routes[path] = routes[path] || {};
    routes[path][lang] = normaliseSlashes(`/${lang}/404`);
  });

  // add fallback page for untraslated routes
  if (untranslatedComponent) {
    for (const route in routes) {
      const routeData = routes[route];
      const routeLanguages = Object.keys(routeData);

      if (routeLanguages.length < languages.length) {
        languages.forEach((lang) => {
          // bail if the route is already there
          if (routeData[lang]) return;

          const context = { route, lang };
          // create path and add the "untranslated" route to the route map too
          const path = normaliseSlashes(`${lang}/${route}`);
          routes[route][lang] = path;

          // create page for untranslated content
          createPage({
            path: path,
            component: untranslatedComponent,
            context: {
              ...context,
              ...getPageContextData(
                { lang, routed: true },
                {
                  availableIn: routeLanguages.map((lang) => ({
                    lang,
                    to: routes[route][lang],
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
      fields: { route, slug, lang },
    } = node;
    let path = normaliseSlashes(`/${lang}/${slug}`);
    const component = getPageComponent({ options, node });
    const context = { id, route, slug, lang };

    if (options.debug) {
      console.log(
        `[gatsby-i18n] createPages: create md pages for path: ${path}, with slug: ${slug}`
      );
    }

    // create page with localised URL
    createPage({
      path: path,
      component,
      context: {
        ...context,
        ...getPageContextData({ lang, routed: true }),
      },
    });

    // create same page without lang slug in URL for default language
    // TODO: maybe instead of this create Netlify `_redirects` file automatically
    if (lang === defaultLanguage) {
      path = normaliseSlashes(slug.replace(`/${defaultLanguage}`, ""));
      createPage({
        path: path,
        component,
        context: {
          ...context,
          ...getPageContextData({ lang, routed: false }),
        },
      });
    }
  });

  addRoutes(routes);
};

module.exports = createPages;
