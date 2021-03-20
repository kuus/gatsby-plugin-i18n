var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

// @ts-check
var nodePath = require("path");

var fs = require("fs");

var _require = require("../utils/options"),
    getOptions = _require.getOptions;

var _require2 = require("../utils"),
    logger = _require2.logger,
    normaliseUrlPath = _require2.normaliseUrlPath;

var _require3 = require("../utils/internal"),
    getPageContextData = _require3.getPageContextData,
    getTemplateBasename = _require3.getTemplateBasename,
    addI18nRoutesMappings = _require3.addI18nRoutesMappings,
    shouldCreateLocalisedPage = _require3.shouldCreateLocalisedPage,
    getI18nConfig = _require3.getI18nConfig;
/**
 * @param {GatsbyI18n.Options} options
 * @param {any} node
 * @returns {string}
 */


var getPageComponent = function getPageComponent(options, node) {
  var pathContent = options.pathContent,
      templateName = options.templateName;
  var relativePath = node.relativePath,
      frontmatter = node.frontmatter,
      fields = node.fields;
  var fileDir = fields.fileDir,
      slug = fields.slug;
  var rightContentPath = Array.isArray(pathContent) ? pathContent[0] : pathContent;
  var componentIdealDir = nodePath.join(rightContentPath, fileDir);
  var componentUsualDir = "src/templates";
  var component;

  if (frontmatter.template) {
    component = nodePath.resolve(componentUsualDir, frontmatter.template + ".tsx" // TODO: js/ts format support
    );
  } else if (relativePath) {
    component = nodePath.resolve(rightContentPath, relativePath);
  } else {
    component = nodePath.resolve(componentIdealDir, templateName);

    if (!fs.existsSync(component)) {
      if (templateName) {
        logger("info", "You can create a file \"" + templateName + "\" in the folder" + (" \"" + componentIdealDir + "\" instead of declaring it explicitly in the") + (" frontmatter section of the page " + slug + "."));
      }
    }
  }

  if (!fs.existsSync(component)) {
    logger("warn", "No template component found for " + node.fileAbsolutePath);
  }

  return component;
};

var createPages = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee(_ref, pluginOptions) {
    var graphql, actions, createPage, createRedirect, options, config, pathContent, templateName, rightContentPath, result, filePages, markdownPages, allPages, routesMap, _loop, routeId;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            graphql = _ref.graphql, actions = _ref.actions;
            createPage = actions.createPage, createRedirect = actions.createRedirect;
            options = getOptions(pluginOptions);
            config = getI18nConfig();
            pathContent = options.pathContent, templateName = options.templateName;
            rightContentPath = "";

            if (Array.isArray(pathContent)) {
              rightContentPath = "(" + pathContent.join("|") + ")";
            } else {
              rightContentPath = pathContent;
            }

            _context.next = 9;
            return graphql("\n    query {\n      allFile(filter: {\n        absolutePath: {regex: \"" + new RegExp(rightContentPath) + "\"},\n        ext: {in: [\".js\", \".jsx\", \".ts\", \".tsx\"]},\n        name: {nin: [\"" + getTemplateBasename(templateName) + "\"]}\n      }) {\n        nodes {\n          id\n          relativePath\n        }\n      }\n      allMarkdown: " + (options.useMdx ? "allMdx" : "allMarkdownRemark") + "(\n        filter: {\n          frontmatter: { template: { ne: null } }\n        }\n      ) {\n        nodes {\n          id\n          fields {\n            slug\n            locale\n            fileDir\n            route\n          }\n          frontmatter {\n            template\n          #  draft\n          #  hidden\n          }\n        }\n      }\n    }\n  ");

          case 9:
            result = _context.sent;
            filePages = result.data.allFile.nodes;
            markdownPages = result.data.allMarkdown.nodes;
            allPages = markdownPages.concat(filePages);
            routesMap =
            /** @type {GatsbyI18n.RoutesMap} */
            {}; // build routes map

            allPages.forEach(function (node) {
              var _node$fields = node.fields,
                  slug = _node$fields.slug,
                  locale = _node$fields.locale,
                  routeId = _node$fields.route;
              var withLocale = normaliseUrlPath("/" + locale + "/" + slug);
              var withoutLocale = normaliseUrlPath("/" + slug);
              var visibleLocale = shouldCreateLocalisedPage(config, locale);
              routesMap[routeId] = routesMap[routeId] || {};
              routesMap[routeId][locale] = visibleLocale ? withLocale : withoutLocale;
            }); // add fallback page for untraslated routes

            if (options.untranslatedComponent) {
              _loop = function _loop(routeId) {
                var routeData = routesMap[routeId];
                var routelocales = Object.keys(routeData); // if the translated versions are less then the default set of locales
                // create some untranslated pages

                if (routelocales.length < config.locales.length) {
                  config.locales.forEach(function (locale) {
                    // bail if the route is already there
                    if (routeData[locale]) return;
                    var context = {
                      route: routeId,
                      locale: locale
                    }; // now we need to determine the url path of the untranslated route

                    var routeDefaultPath = routeData[config.defaultLocale]; // if it exists use the route's path assigned to the default locale,
                    // otherwise use as path the route id preceded by the current locale

                    var withLocale = routeDefaultPath ? routeDefaultPath.replace(config.defaultLocale, locale) : locale + "/" + routeId; // then normalises the URL slashes

                    withLocale = normaliseUrlPath(withLocale); // add the "untranslated" route to the routes map too

                    routesMap[routeId][locale] = withLocale;
                    var availableIn = routelocales.map(function (locale) {
                      return {
                        locale: locale,
                        to: routesMap[routeId][locale]
                      };
                    }); // create page for untranslated content

                    createPage({
                      path: withLocale,
                      component: options.untranslatedComponent,
                      context: (0, _extends2.default)({}, context, getPageContextData(locale, {
                        availableIn: availableIn
                      }))
                    });
                  });
                }
              };

              for (routeId in routesMap) {
                _loop(routeId);
              }
            } // create all markdown pages, the file ones, instead, are handled by gatsby
            // through the createStatefulPages lifecycle and are therefore just treated in
            // the `onCreatePage` of the specific project using this plugin


            markdownPages.forEach(function (node) {
              var id = node.id,
                  _node$fields2 = node.fields,
                  routeId = _node$fields2.route,
                  slug = _node$fields2.slug,
                  locale = _node$fields2.locale;
              var withLocale = normaliseUrlPath("/" + locale + "/" + slug);
              var withoutLocale = normaliseUrlPath("/" + slug);
              var visibleLocale = shouldCreateLocalisedPage(config, locale);
              var component = getPageComponent(options, node); // FIXME: check what we actually need to pass to context

              var context = {
                id: id,

                /* route: routeId, slug, */
                locale: locale
              };

              if (options.debug) {
                logger("info", "createPages: create md pages for slug: " + slug);
              } // create page with right URLs


              createPage({
                path: visibleLocale ? withLocale : withoutLocale,
                component: component,
                context: (0, _extends2.default)({}, context, getPageContextData(locale))
              }); // always create redirects for the default locale either one way or the
              // other (with->without or without->with)

              if (!options.hasSplatRedirects && locale === config.defaultLocale) {
                createRedirect({
                  fromPath: visibleLocale ? withoutLocale : withLocale,
                  toPath: visibleLocale ? withLocale : withoutLocale,
                  isPermanent: true
                });
              }
            });
            addI18nRoutesMappings(routesMap);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function createPages(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = createPages;