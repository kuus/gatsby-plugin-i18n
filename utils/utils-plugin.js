var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

// @ts-check
var fs = require("fs");

var path = require("path");

var yaml = require("js-yaml");

var _require = require("./options"),
    getOptions = _require.getOptions;

var _require2 = require("."),
    logger = _require2.logger,
    normaliseUrlPath = _require2.normaliseUrlPath,
    normaliseRouteId = _require2.normaliseRouteId,
    findRouteForPath = _require2.findRouteForPath;
/**
 * @typedef {ReturnType<import("./options").getOptions>} Options
 *
 * @typedef {{ [key: string]: { [key: string]: string } }} RoutesMap
 */


var getRoutesPath = function getRoutesPath() {
  return __dirname + "/.routes.json";
};

var getOptionsPath = function getOptionsPath() {
  return __dirname + "/.config.json";
};
/**
 * Clean/resets the routes mapping cached to disk
 */


var cleanI18nRoutesMap = function cleanI18nRoutesMap() {
  writeI18nRoutesMap({});
};
/**
 * Read and returns the routes mapping cached to disk
 */


var getI18nRoutesMap = function getI18nRoutesMap() {
  var routesMap = {};

  try {
    routesMap = JSON.parse(fs.readFileSync(getRoutesPath(), "utf-8"));
  } catch (e) {
    logger("warn", "Failed to read file " + getRoutesPath());
  }

  return routesMap;
};
/**
 * Write the routes mapping to disk, mostly in order to be used from the custom
 * Link component
 *
 * @param {RoutesMap} data
 */


var writeI18nRoutesMap = function writeI18nRoutesMap(data) {
  try {
    fs.writeFileSync(getRoutesPath(), JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", "Failed to write file " + getRoutesPath());
  }
};
/**
 * Add routes mapping to disk cache file, this helper can be used from your project
 * for instance to dynamically add localised pages like tags in your project's
 * `gatsby-node.js`
 *
 * @param {RoutesMap} data
 */


var addI18nRoutesMappings = function addI18nRoutesMappings(data) {
  var existingRoutes = getI18nRoutesMap();
  writeI18nRoutesMap((0, _extends2.default)({}, existingRoutes, data));
};
/**
 * @returns {Options}
 */


var getI18nOptions = function getI18nOptions() {
  try {
    return getOptions(require(getOptionsPath()));
  } catch (e) {
    logger("error", "Failed to read file " + getOptionsPath());
  }
};
/**
 * We write config to a file so that we can use it from the project implementing
 * this plugin in its own `onCreatePage` gatsby-node hook, the reason for this
 * is that we cannot get the pages created from this plugin's `onCreatePage`
 * because gatsby prevents it to avoid infinite loop, see [comment here](./onCreatePage).
 * Because of this that work need to be done in the project and in there we cannot
 * get this plugin's options and configuration, so we write it to a file and
 * read it with `getI18nOptions` at the right time.
 *
 * @param {Options} pluginOptions
 */


var writeI18nOptions = function writeI18nOptions(pluginOptions) {
  var data = getOptions(pluginOptions);

  try {
    fs.writeFileSync(getOptionsPath(), JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", "Failed to write file " + getOptionsPath());
  }
};

var flattenMessages = function flattenMessages(nestedMessages, prefix) {
  if (prefix === void 0) {
    prefix = "";
  }

  return Object.keys(nestedMessages).reduce(function (messages, key) {
    var value = nestedMessages[key];
    var prefixedKey = prefix ? prefix + "." + key : key;

    if (typeof value === "string") {
      messages[prefixedKey] = value;
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey));
    }

    return messages;
  }, {});
};
/**
 * @param {string} fullPath
 */


var getMessages = function getMessages(fullPath) {
  try {
    var messages = yaml.load(fs.readFileSync(fullPath, "utf8"));
    return flattenMessages(messages);
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      process.env.NODE_ENV !== "test" && logger("error", "couldn't find file \"" + fullPath + "\"");
    }

    throw error;
  }
};
/**
 * If a localised messages file (e.g. `en.yml`) does not exist it creates it
 *
 * @param {Options} options
 * @param {string} locale
 * @returns {string} The path of the localised messages file
 */


var ensureLocalisedMessagesFile = function ensureLocalisedMessagesFile(options, locale) {
  var fullPath = path.join(options.pathData, locale + ".yml");

  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, "", "utf-8");
  }

  return fullPath;
};
/**
 * Ensure that files with translated strings exist, if the don't they are created
 *
 * @param {Options} pluginOptions
 */


var ensureLocalisedMessagesFiles = function ensureLocalisedMessagesFiles(pluginOptions) {
  var options = getOptions(pluginOptions);
  options.locales.forEach(function (locale) {
    ensureLocalisedMessagesFile(options, locale);
  });
};
/**
 * Get gatsby's page context data
 *
 * @param {{ options: Options; locale: string; }} args
 * @param {object} additional
 */


var getPageContextData = function getPageContextData(_ref, additional) {
  var options = _ref.options,
      locale = _ref.locale;

  if (additional === void 0) {
    additional = {};
  }

  var _ref2 = options || getI18nOptions(),
      locales = _ref2.locales,
      defaultLocale = _ref2.defaultLocale;

  locale = locale || defaultLocale;
  var messagesPath = ensureLocalisedMessagesFile(options, locale);
  var messages = getMessages(messagesPath);
  return {
    i18n: (0, _extends2.default)({
      locales: locales,
      defaultLocale: defaultLocale,
      currentLocale: locale,
      messages: messages
    }, additional)
  };
};
/**
 * Extract from path
 *
 * Given the file "/my/page/index.en.md":
 * - `route` will be e.g. "/my/page"
 * - `slug` will be e.g. "/my/page"
 * - `locale` will be e.g. "en"
 * - `fileDir` will be e.g. "/my/page"
 *
 * @param {{ options: Options; fileAbsolutePath: string; }} args
 */


var extractFromPath = function extractFromPath(_ref3) {
  var options = _ref3.options,
      fileAbsolutePath = _ref3.fileAbsolutePath;
  var file = extractFileParts(options, fileAbsolutePath);
  var route = getFileRouteId(file);
  var slug = getFileSlug(file);
  var locale = getFileLocale(options, file);
  return {
    route: route,
    slug: slug,
    locale: locale,
    fileDir: file.dir
  };
};
/**
 * Extract file parts
 *
 * Given the file "/my/page/index.en.md" `file`'s properties will be:
 * - `dir` e.g. "/my/page"
 * - `name` e.g. "page"
 * - `locale` e.g. "en"
 *
 * @param {Options} options
 * @param {string} fileAbsolutePath
 */


var extractFileParts = function extractFileParts(options, fileAbsolutePath) {
  var pathContent = options.pathContent;
  var rightContentPath = "";

  if (Array.isArray(pathContent)) {
    var matches = pathContent.filter(function (p) {
      return fileAbsolutePath.includes(p);
    });

    if (matches) {
      rightContentPath = matches[0];
    } else {
      rightContentPath = pathContent[0];
    }
  }

  var fileRelativePath = fileAbsolutePath.split(rightContentPath)[1];
  var dir = path.dirname(fileRelativePath);
  var name = path.basename(fileAbsolutePath, ".md");
  name = getTemplateBasename(name);
  var nameChunks = name.split("."); // remove optional locale info from filename, e.g. "index.en.md"

  name = nameChunks[0]; // grab last name part after dot or return `null` if locale is not specified

  var locale = nameChunks.length > 1 ? nameChunks[nameChunks.length - 1] : null;
  return {
    dir: dir,
    name: name,
    locale: locale
  };
};
/**
 * Get file's routeId from the information extracted by its path
 *
 * The routeId matches the src/pages directory structure, which represents the
 * default locale slugs usually
 *
 * @param {ReturnType<typeof extractFileParts>} file
 */


var getFileRouteId = function getFileRouteId(_ref4) {
  var dir = _ref4.dir,
      name = _ref4.name;
  var routeId = name === "index" ? dir : dir + "/" + name;
  routeId = normaliseRouteId(routeId);
  return routeId;
};
/**
 * Get file's slug from the information extracted by its path
 *
 * @param {ReturnType<typeof extractFileParts>} file
 */


var getFileSlug = function getFileSlug(_ref5) {
  var dir = _ref5.dir,
      name = _ref5.name;
  var slug = name === "index" ? dir : dir + "/" + name;
  slug = normaliseUrlPath(slug);
  return slug;
};
/**
 *
 * @param {Options} options
 * @param {ReturnType<typeof extractFileParts>} file
 */


var getFileLocale = function getFileLocale(options, file) {
  var locales = options.locales,
      defaultLocale = options.defaultLocale;
  var locale = defaultLocale;

  if (file.locale) {
    if (locales.includes(file.locale)) {
      locale = file.locale;
    } else {
      logger("error", "You need to add the locale " + file.locale + " to the plugin options");
    }
  }

  return locale;
};
/**
 * Is file to localise?
 *
 * It checks that the given file path is within the `pathContent` defined in the
 * plugin options and that it is not a template
 *
 * @param {{ pathContent: string|Array<string>; templateName: string }} file
 * @param {string} filePath
 * @returns {boolean}
 */


var isFileToLocalise = function isFileToLocalise(_ref6, filePath) {
  var pathContent = _ref6.pathContent,
      templateName = _ref6.templateName;

  if (!filePath) {
    return false;
  }

  var isInContentPath = false;
  var extName = path.extname(filePath); // console.log(`isFileToLocalise? ${filePath}, with 'extName': ${extName}`)
  // disregard file types other than markdown and templates

  if ([".md", ".mdx", ".js", ".jsx", ".ts", ".tsx"].indexOf(extName) === -1) {
    return false;
  }

  if (typeof pathContent === "string") {
    if (filePath.includes(pathContent)) {
      isInContentPath = true;
    }
  } else if (Array.isArray(pathContent)) {
    for (var i = 0; i < pathContent.length; i++) {
      if (filePath.includes(pathContent[i])) {
        isInContentPath = true;
        break;
      }
    }
  }

  var fileBasename = path.basename(filePath);
  return isInContentPath && fileBasename !== templateName;
};
/**
 * Get template basename stripping out allowed extensions
 *
 * @param {string} name
 * @returns {string}
 */


var getTemplateBasename = function getTemplateBasename(name) {
  name = path.basename(name, ".js");
  name = path.basename(name, ".jsx");
  name = path.basename(name, ".tsx");
  return name;
};
/**
 *
 * @param {Options} options
 * @param {string} locale
 */


var shouldCreateLocalisedPage = function shouldCreateLocalisedPage(options, locale) {
  if (locale === options.defaultLocale && options.hideDefaultLocaleInUrl) {
    return false;
  }

  return true;
};
/**
 * @param {Options} options
 * @param {any} page
 * @param {string} [locale]
 * @param {string} [path]
 * @param {string} [matchPath]
 */


var getPage = function getPage(options, page, locale, path, matchPath) {
  var data = (0, _extends2.default)({}, page, {
    path: path,
    matchPath: matchPath || path,
    // FIXME: check what we actually need to pass to context
    context: (0, _extends2.default)({}, page.context, {
      locale: locale
    }, getPageContextData({
      options: options,
      locale: locale
    }))
  });
  return data;
};
/**
 * Put defaultLocale as last in the array, this is useful to create netlify
 * redirects in the right order
 *
 * @param {Options} options
 */


var reorderLocales = function reorderLocales(options) {
  var locales = options.locales,
      defaultLocale = options.defaultLocale;
  var sorted = [].concat(locales);
  var oldIdx = sorted.indexOf(defaultLocale);
  var newIdx = sorted.length - 1;
  sorted.splice(newIdx, 0, sorted.splice(oldIdx, 1)[0]);
  return sorted;
};

module.exports = {
  cleanI18nRoutesMap: cleanI18nRoutesMap,
  addI18nRoutesMappings: addI18nRoutesMappings,
  writeI18nOptions: writeI18nOptions,
  getPageContextData: getPageContextData,
  extractFromPath: extractFromPath,
  isFileToLocalise: isFileToLocalise,
  getTemplateBasename: getTemplateBasename,
  normaliseUrlPath: normaliseUrlPath,
  findRouteForPath: findRouteForPath,
  ensureLocalisedMessagesFiles: ensureLocalisedMessagesFiles,
  getI18nOptions: getI18nOptions,
  shouldCreateLocalisedPage: shouldCreateLocalisedPage,
  getPage: getPage,
  reorderLocales: reorderLocales
};