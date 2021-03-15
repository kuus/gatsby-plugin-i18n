// @ts-check

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { getOptions } = require("./options");
const {
  logger,
  normaliseUrlPath,
  normaliseRouteId,
  findRouteForPath,
} = require("./utils");

/**
 * @typedef {ReturnType<import("./options").getOptions>} Options
 *
 * @typedef {{ [key: string]: { [key: string]: string } }} RoutesMap
 */

const getRoutesPath = () => {
  return `${__dirname}/.routes.json`;
};

const getOptionsPath = () => {
  return `${__dirname}/.config.json`;
};

/**
 * Clean/resets the routes mapping cached to disk
 */
const cleanI18nRoutesMap = () => {
  writeI18nRoutesMap({});
};

/**
 * Read and returns the routes mapping cached to disk
 */
const getI18nRoutesMap = () => {
  let routesMap = {};

  try {
    routesMap = JSON.parse(fs.readFileSync(getRoutesPath(), "utf-8"));
  } catch (e) {
    logger("warn", `Failed to read file ${getRoutesPath()}`);
  }

  return routesMap;
};

/**
 * Write the routes mapping to disk, mostly in order to be used from the custom
 * Link component
 *
 * @param {RoutesMap} data
 */
const writeI18nRoutesMap = (data) => {
  try {
    fs.writeFileSync(getRoutesPath(), JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", `Failed to write file ${getRoutesPath()}`);
  }
};

/**
 * Add routes mapping to disk cache file, this helper can be used from your project
 * for instance to dynamically add localised pages like tags in your project's
 * `gatsby-node.js`
 *
 * @param {RoutesMap} data
 */
const addI18nRoutesMappings = (data) => {
  const existingRoutes = getI18nRoutesMap();
  writeI18nRoutesMap({ ...existingRoutes, ...data });
};

/**
 * @returns {Options}
 */
const getI18nOptions = () => {
  try {
    return getOptions(require(getOptionsPath()));
  } catch (e) {
    logger("error", `Failed to read file ${getOptionsPath()}`);
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
const writeI18nOptions = (pluginOptions) => {
  const data = getOptions(pluginOptions);

  try {
    fs.writeFileSync(getOptionsPath(), JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", `Failed to write file ${getOptionsPath()}`);
  }
};

const flattenMessages = (nestedMessages, prefix = "") => {
  return Object.keys(nestedMessages).reduce((messages, key) => {
    let value = nestedMessages[key];
    let prefixedKey = prefix ? `${prefix}.${key}` : key;

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
const getMessages = (fullPath) => {
  try {
    const messages = yaml.load(fs.readFileSync(fullPath, "utf8"));

    return flattenMessages(messages);
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      process.env.NODE_ENV !== "test" &&
        logger("error", `couldn't find file "${fullPath}"`);
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
const ensureLocalisedMessagesFile = (options, locale) => {
  const fullPath = path.join(options.pathData, `${locale}.yml`);
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
const ensureLocalisedMessagesFiles = (pluginOptions) => {
  const options = getOptions(pluginOptions);
  options.locales.forEach((locale) => {
    ensureLocalisedMessagesFile(options, locale);
  });
};

/**
 * Get gatsby's page context data
 *
 * @param {{ options: Options; locale: string; }} args
 * @param {object} additional
 */
const getPageContextData = ({ options, locale }, additional = {}) => {
  const { locales, defaultLocale } = options || getI18nOptions();
  locale = locale || defaultLocale;
  const messagesPath = ensureLocalisedMessagesFile(options, locale);
  const messages = getMessages(messagesPath);

  return {
    i18n: {
      locales,
      defaultLocale,
      currentLocale: locale,
      messages,
      ...additional,
    },
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
const extractFromPath = ({ options, fileAbsolutePath }) => {
  const file = extractFileParts(options, fileAbsolutePath);
  const route = getFileRouteId(file);
  const slug = getFileSlug(file);
  const locale = getFileLocale(options, file);

  return { route, slug, locale, fileDir: file.dir };
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
const extractFileParts = (options, fileAbsolutePath) => {
  const { pathContent } = options;
  let rightContentPath = "";
  if (Array.isArray(pathContent)) {
    const matches = pathContent.filter((p) => fileAbsolutePath.includes(p));
    if (matches) {
      rightContentPath = matches[0];
    } else {
      rightContentPath = pathContent[0];
    }
  }
  const fileRelativePath = fileAbsolutePath.split(rightContentPath)[1];
  const dir = path.dirname(fileRelativePath);
  let name = path.basename(fileAbsolutePath, ".md");
  name = getTemplateBasename(name);
  const nameChunks = name.split(".");
  // remove optional locale info from filename, e.g. "index.en.md"
  name = nameChunks[0];
  // grab last name part after dot or return `null` if locale is not specified
  const locale =
    nameChunks.length > 1 ? nameChunks[nameChunks.length - 1] : null;

  return { dir, name, locale };
};

/**
 * Get file's routeId from the information extracted by its path
 *
 * The routeId matches the src/pages directory structure, which represents the
 * default locale slugs usually
 *
 * @param {ReturnType<typeof extractFileParts>} file
 */
const getFileRouteId = ({ dir, name }) => {
  let routeId = name === "index" ? dir : `${dir}/${name}`;
  routeId = normaliseRouteId(routeId);
  return routeId;
};

/**
 * Get file's slug from the information extracted by its path
 *
 * @param {ReturnType<typeof extractFileParts>} file
 */
const getFileSlug = ({ dir, name }) => {
  let slug = name === "index" ? dir : `${dir}/${name}`;
  slug = normaliseUrlPath(slug);
  return slug;
};

/**
 *
 * @param {Options} options
 * @param {ReturnType<typeof extractFileParts>} file
 */
const getFileLocale = (options, file) => {
  const { locales, defaultLocale } = options;
  let locale = defaultLocale;

  if (file.locale) {
    if (locales.includes(file.locale)) {
      locale = file.locale;
    } else {
      logger(
        "error",
        `You need to add the locale ${file.locale} to the plugin options`
      );
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
const isFileToLocalise = ({ pathContent, templateName }, filePath) => {
  if (!filePath) {
    return false;
  }
  let isInContentPath = false;
  const extName = path.extname(filePath);
  // console.log(`isFileToLocalise? ${filePath}, with 'extName': ${extName}`)

  // disregard file types other than markdown and templates
  if ([".md", ".mdx", ".js", ".jsx", ".ts", ".tsx"].indexOf(extName) === -1) {
    return false;
  }
  if (typeof pathContent === "string") {
    if (filePath.includes(pathContent)) {
      isInContentPath = true;
    }
  } else if (Array.isArray(pathContent)) {
    for (let i = 0; i < pathContent.length; i++) {
      if (filePath.includes(pathContent[i])) {
        isInContentPath = true;
        break;
      }
    }
  }

  const fileBasename = path.basename(filePath);

  return isInContentPath && fileBasename !== templateName;
};

/**
 * Get template basename stripping out allowed extensions
 *
 * @param {string} name
 * @returns {string}
 */
const getTemplateBasename = (name) => {
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
const shouldCreateLocalisedPage = (options, locale) => {
  if (locale === options.defaultLocale && options.hideDefaultLocaleInUrl) {
    return false;
  }
  return true;
};

/**
 * FIXME: clean up matchPath
 * @param {Options} options
 * @param {any} page
 * @param {string} [locale]
 * @param {string} [path]
 * @param {string} [matchPath]
 */
const getPage = (options, page, locale, path, matchPath) => {
  // const hasWildcard = matchPath ? matchPath.indexOf("*") >= 0 : false;
  const data = {
    ...page,
    path,
    matchPath: path,
    // FIXME: check what we actually need to pass to context
    context: {
      ...page.context,
      locale,
      ...getPageContextData({ options, locale }),
    },
  };

  // if (matchPath) {
  //   matchPath = locale ? `/${locale}/${matchPath}` : `/${matchPath}`;
  //   // don't add trailing slash to 404 wildcard match path, otherwise we would
  //   // have the following matchPath value: `/en/*/`
  //   matchPath = hasWildcard ? matchPath : normaliseUrlPath(matchPath);
  //   data.matchPath = matchPath;
  // }

  return data;
};

module.exports = {
  cleanI18nRoutesMap,
  addI18nRoutesMappings,
  writeI18nOptions,
  getPageContextData,
  extractFromPath,
  isFileToLocalise,
  getTemplateBasename,
  normaliseUrlPath,
  findRouteForPath,
  ensureLocalisedMessagesFiles,
  getI18nOptions,
  shouldCreateLocalisedPage,
  getPage,
};
