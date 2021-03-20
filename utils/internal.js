var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

// @ts-check
var fs = require("fs");

var path = require("path");

var yaml = require("js-yaml");

var _require = require("./options"),
    getOptions = _require.getOptions,
    getConfig = _require.getConfig;

var _require2 = require("."),
    logger = _require2.logger,
    normaliseUrlPath = _require2.normaliseUrlPath,
    normaliseRouteId = _require2.normaliseRouteId,
    findRouteForPath = _require2.findRouteForPath;
/**
 * @type {string}
 */


var configPath;
/**
 * @type {string}
 */

var optionsPath = path.resolve(__dirname, "../", ".options.json");
/**
 * @type {string}
 */

var routesPath = path.resolve(__dirname, "../", ".routes.json");
/**
 * We write config to a file so that we can use it from the project implementing
 * this plugin in its own `onCreatePage` gatsby-node hook, the reason for this
 * is that we cannot get the pages created from this plugin's `onCreatePage`
 * because gatsby prevents it to avoid infinite loop, see [comment here](./onCreatePage).
 * Because of this that work need to be done in the project and in there we cannot
 * get this plugin's options and configuration, so we write it to a file and
 * read it with `getI18nOptions` at the right time.
 *
 * @param {string} baseDir
 */

var ensureI18nConfig = function ensureI18nConfig(baseDir) {
  var _getI18nOptions = getI18nOptions(),
      debug = _getI18nOptions.debug,
      pathConfig = _getI18nOptions.pathConfig;

  configPath = path.join(baseDir, pathConfig);

  if (!fs.existsSync(configPath)) {
    try {
      var data = getConfig();
      var ext = path.extname(configPath);
      var content = ext === ".yml" ? yaml.dump(data) : JSON.stringify(data);
      fs.writeFileSync(configPath, content, "utf-8");
    } catch (e) {
      logger("error", "Failed to write required file " + configPath);
    }
  } else {
    if (debug) {
      logger("info", "Found config file at " + configPath);
    }
  }
};
/**
 * @returns {GatsbyI18n.Config}
 */


var getI18nConfig = function getI18nConfig() {
  try {
    var data = fs.readFileSync(configPath, "utf8");
    var ext = path.extname(configPath);
    var content = ext === ".yml" ? yaml.load(data) : JSON.parse(data);
    return content;
  } catch (e) {
    logger("error", "Failed to read file " + configPath);
  }
};
/**
 * @returns {GatsbyI18n.Options}
 */


var getI18nOptions = function getI18nOptions() {
  try {
    return getOptions(require(optionsPath));
  } catch (e) {
    logger("error", "Failed to read file " + optionsPath);
  }
};
/**
 * We write options to a file, the reason why is explained above,
 * @see ensureI18nConfig
 *
 * @param {Partial<GatsbyI18n.Options>} custom
 */


var writeI18nOptions = function writeI18nOptions(custom) {
  var data = getOptions(custom);

  try {
    fs.writeFileSync(optionsPath, JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", "Failed to write file " + optionsPath);
  }
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
    routesMap = JSON.parse(fs.readFileSync(routesPath, "utf-8"));
  } catch (e) {
    logger("warn", "Failed to read file " + routesPath);
  }

  return routesMap;
};
/**
 * Write the routes mapping to disk, mostly in order to be used from the custom
 * Link component
 *
 * @param {GatsbyI18n.RoutesMap} data
 */


var writeI18nRoutesMap = function writeI18nRoutesMap(data) {
  try {
    fs.writeFileSync(routesPath, JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", "Failed to write file " + routesPath);
  }
};
/**
 * Add routes mapping to disk cache file, this helper can be used from your project
 * for instance to dynamically add localised pages like tags in your project's
 * `gatsby-node.js`
 *
 * @param {GatsbyI18n.RoutesMap} data
 */


var addI18nRoutesMappings = function addI18nRoutesMappings(data) {
  var existingRoutes = getI18nRoutesMap();
  writeI18nRoutesMap((0, _extends2.default)({}, existingRoutes, data));
};
/**
 * Flatten nested messages object data
 *
 * @param {{ [key: string]: string | { [key: string]: string; }}} nestedMessages
 * @param {string} [prefix]
 * @returns
 */


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
    var messages =
    /** @type {object} */
    yaml.load(fs.readFileSync(fullPath, "utf8"));
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
 * @param {string} pathMessages
 * @param {string} locale
 * @returns {string} The path of the localised messages file
 */


var ensureLocalisedMessagesFile = function ensureLocalisedMessagesFile(pathMessages, locale) {
  var fullPath = path.join(pathMessages, locale + ".yml");

  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, "", "utf-8");
  }

  return fullPath;
};
/**
 * Ensure that files with translated strings exist, if the don't they are created
 */


var ensureLocalisedMessagesFiles = function ensureLocalisedMessagesFiles() {
  var _getI18nConfig = getI18nConfig(),
      locales = _getI18nConfig.locales;

  var _getI18nOptions2 = getI18nOptions(),
      pathMessages = _getI18nOptions2.pathMessages;

  locales.forEach(function (locale) {
    ensureLocalisedMessagesFile(pathMessages, locale);
  });
};
/**
 * Get gatsby's page context data
 *
 * @param {string} locale
 * @param {object} [additional]
 * @returns {GatsbyI18n.PageContext}
 */


var getPageContextData = function getPageContextData(locale, additional) {
  if (additional === void 0) {
    additional = {};
  }

  var _getI18nConfig2 = getI18nConfig(),
      locales = _getI18nConfig2.locales,
      defaultLocale = _getI18nConfig2.defaultLocale;

  var _getI18nOptions3 = getI18nOptions(),
      pathMessages = _getI18nOptions3.pathMessages;

  locale = locale || defaultLocale;
  var messagesPath = ensureLocalisedMessagesFile(pathMessages, locale);
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
 * - `routeId` will be e.g. "/my/page"
 * - `slug` will be e.g. "/my/page"
 * - `locale` will be e.g. "en"
 * - `fileDir` will be e.g. "/my/page"
 *
 * @param {string} fileAbsolutePath
 */


var extractFromPath = function extractFromPath(fileAbsolutePath) {
  var file = extractFileParts(fileAbsolutePath);
  var routeId = getFileRouteId(file);
  var slug = getFileSlug(file);
  var locale = getFileLocale(file);
  return {
    routeId: routeId,
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
 * @param {string} fileAbsolutePath
 */


var extractFileParts = function extractFileParts(fileAbsolutePath) {
  var _getI18nOptions4 = getI18nOptions(),
      pathContent = _getI18nOptions4.pathContent;

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


var getFileRouteId = function getFileRouteId(_ref) {
  var dir = _ref.dir,
      name = _ref.name;
  var routeId = name === "index" ? dir : dir + "/" + name;
  routeId = normaliseRouteId(routeId);
  return routeId;
};
/**
 * Get file's slug from the information extracted by its path
 *
 * @param {ReturnType<typeof extractFileParts>} file
 */


var getFileSlug = function getFileSlug(_ref2) {
  var dir = _ref2.dir,
      name = _ref2.name;
  var slug = name === "index" ? dir : dir + "/" + name;
  slug = normaliseUrlPath(slug);
  return slug;
};
/**
 *
 * @param {ReturnType<typeof extractFileParts>} file
 */


var getFileLocale = function getFileLocale(file) {
  var _getI18nConfig3 = getI18nConfig(),
      locales = _getI18nConfig3.locales,
      defaultLocale = _getI18nConfig3.defaultLocale;

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
 * @param {string} filePath
 * @returns {boolean}
 */


var isFileToLocalise = function isFileToLocalise(filePath) {
  if (!filePath) {
    return false;
  }

  var _getI18nOptions5 = getI18nOptions(),
      pathContent = _getI18nOptions5.pathContent,
      templateName = _getI18nOptions5.templateName;

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
 * @param {GatsbyI18n.Config} config
 * @param {string} locale
 */


var shouldCreateLocalisedPage = function shouldCreateLocalisedPage(config, locale) {
  if (locale === config.defaultLocale && config.hideDefaultLocaleInUrl) {
    return false;
  }

  return true;
};
/**
 * @param {import("gatsby").Page<{}>} page
 * @param {string} [locale]
 * @param {string} [path]
 * @param {string} [matchPath]
 */


var getPage = function getPage(page, locale, path, matchPath) {
  var data = (0, _extends2.default)({}, page, {
    path: path,
    matchPath: matchPath || path,
    // FIXME: check what we actually need to pass to context
    context: (0, _extends2.default)({}, page.context, {
      locale: locale
    }, getPageContextData(locale))
  });
  return data;
};
/**
 * Put defaultLocale as last in the array, this is useful to create netlify
 * redirects in the right order
 *
 * @param {GatsbyI18n.Config} config
 */


var reorderLocales = function reorderLocales(config) {
  var locales = config.locales,
      defaultLocale = config.defaultLocale;
  var sorted = [].concat(locales);
  var oldIdx = sorted.indexOf(defaultLocale);
  var newIdx = sorted.length - 1;
  sorted.splice(newIdx, 0, sorted.splice(oldIdx, 1)[0]);
  return sorted;
};

module.exports = {
  ensureI18nConfig: ensureI18nConfig,
  getI18nConfig: getI18nConfig,
  getI18nOptions: getI18nOptions,
  writeI18nOptions: writeI18nOptions,
  getI18nRoutesMap: getI18nRoutesMap,
  cleanI18nRoutesMap: cleanI18nRoutesMap,
  addI18nRoutesMappings: addI18nRoutesMappings,
  ensureLocalisedMessagesFiles: ensureLocalisedMessagesFiles,
  getPageContextData: getPageContextData,
  extractFromPath: extractFromPath,
  isFileToLocalise: isFileToLocalise,
  getTemplateBasename: getTemplateBasename,
  shouldCreateLocalisedPage: shouldCreateLocalisedPage,
  getPage: getPage,
  reorderLocales: reorderLocales
};