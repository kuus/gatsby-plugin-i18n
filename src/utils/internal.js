// @ts-check

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { getOptions, getConfig } = require("./options");
const {
  logger,
  normaliseUrlPath,
  normaliseRouteId,
  findRouteForPath,
} = require(".");

/**
 * @type {string}
 */
let configPath;

/**
 * @type {string}
 */
let optionsPath = path.resolve(__dirname, "../", ".options.json");

/**
 * @type {string}
 */
let routesPath = path.resolve(__dirname, "../", ".routes.json");

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
 const ensureI18nConfig = (baseDir) => {
  const { debug, pathConfig } = getI18nOptions();

  configPath = path.join(baseDir, pathConfig);

  if (!fs.existsSync(configPath)) {
    try {
      const data = getConfig();
      const ext = path.extname(configPath);
      const content = ext === ".yml" ? yaml.dump(data) : JSON.stringify(data);
      fs.writeFileSync(configPath, content, "utf-8");
    } catch (e) {
      logger("error", `Failed to write required file ${configPath}`);
    }
  } else {
    if (debug) {
      logger("info", `Found config file at ${configPath}`);
    }
  }
};

/**
 * @returns {GatsbyI18n.Config}
 */
const getI18nConfig = () => {
  try {
    const data = fs.readFileSync(configPath, "utf8");
    const ext = path.extname(configPath);
    const content = ext === ".yml" ? yaml.load(data) : JSON.parse(data);
    return content;
  } catch (e) {
    logger("error", `Failed to read file ${configPath}`);
  }
};

/**
 * @returns {GatsbyI18n.Options}
 */
const getI18nOptions = () => {
  try {
    return getOptions(require(optionsPath));
  } catch (e) {
    logger("error", `Failed to read file ${optionsPath}`);
  }
};

/**
 * We write options to a file, the reason why is explained above,
 * @see ensureI18nConfig
 *
 * @param {Partial<GatsbyI18n.Options>} custom
 */
const writeI18nOptions = (custom) => {
  const data = getOptions(custom);

  try {
    fs.writeFileSync(optionsPath, JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", `Failed to write file ${optionsPath}`);
  }
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
    routesMap = JSON.parse(fs.readFileSync(routesPath, "utf-8"));
  } catch (e) {
    logger("warn", `Failed to read file ${routesPath}`);
  }

  return routesMap;
};

/**
 * Write the routes mapping to disk, mostly in order to be used from the custom
 * Link component
 *
 * @param {GatsbyI18n.RoutesMap} data
 */
const writeI18nRoutesMap = (data) => {
  try {
    fs.writeFileSync(routesPath, JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", `Failed to write file ${routesPath}`);
  }
};

/**
 * Add routes mapping to disk cache file, this helper can be used from your project
 * for instance to dynamically add localised pages like tags in your project's
 * `gatsby-node.js`
 *
 * @param {GatsbyI18n.RoutesMap} data
 */
const addI18nRoutesMappings = (data) => {
  const existingRoutes = getI18nRoutesMap();
  writeI18nRoutesMap({ ...existingRoutes, ...data });
};

/**
 * Flatten nested messages object data
 *
 * @param {{ [key: string]: string | { [key: string]: string; }}} nestedMessages
 * @param {string} [prefix]
 * @returns
 */
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
    const messages = /** @type {object} */ (yaml.load(
      fs.readFileSync(fullPath, "utf8")
    ));

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
 * @param {string} pathMessages
 * @param {string} locale
 * @returns {string} The path of the localised messages file
 */
const ensureLocalisedMessagesFile = (pathMessages, locale) => {
  const fullPath = path.join(pathMessages, `${locale}.yml`);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, "", "utf-8");
  }

  return fullPath;
};

/**
 * Ensure that files with translated strings exist, if the don't they are created
 */
const ensureLocalisedMessagesFiles = () => {
  const { locales } = getI18nConfig();
  const { pathMessages } = getI18nOptions();

  locales.forEach((locale) => {
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
const getPageContextData = (locale, additional = {}) => {
  const { locales, defaultLocale } = getI18nConfig();
  const { pathMessages } = getI18nOptions();

  locale = locale || defaultLocale;
  const messagesPath = ensureLocalisedMessagesFile(pathMessages, locale);
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
 * - `routeId` will be e.g. "/my/page"
 * - `slug` will be e.g. "/my/page"
 * - `locale` will be e.g. "en"
 * - `fileDir` will be e.g. "/my/page"
 *
 * @param {string} fileAbsolutePath
 */
const extractFromPath = (fileAbsolutePath) => {
  const file = extractFileParts(fileAbsolutePath);
  const routeId = getFileRouteId(file);
  const slug = getFileSlug(file);
  const locale = getFileLocale(file);

  return { routeId, slug, locale, fileDir: file.dir };
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
const extractFileParts = (fileAbsolutePath) => {
  const { pathContent } = getI18nOptions();
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
 * @param {ReturnType<typeof extractFileParts>} file
 */
const getFileLocale = (file) => {
  const { locales, defaultLocale } = getI18nConfig();
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
 * @param {string} filePath
 * @returns {boolean}
 */
const isFileToLocalise = (filePath) => {
  if (!filePath) {
    return false;
  }
  const { pathContent, templateName } = getI18nOptions();
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
 * @param {GatsbyI18n.Config} config
 * @param {string} locale
 */
const shouldCreateLocalisedPage = (config, locale) => {
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
const getPage = (page, locale, path, matchPath) => {
  const data = {
    ...page,
    path,
    matchPath: matchPath || path,
    // FIXME: check what we actually need to pass to context
    context: {
      ...page.context,
      locale,
      ...getPageContextData(locale),
    },
  };

  return data;
};

/**
 * Put defaultLocale as last in the array, this is useful to create netlify
 * redirects in the right order
 *
 * @param {GatsbyI18n.Config} config
 */
const reorderLocales = (config) => {
  const { locales, defaultLocale } = config;
  const sorted = [...locales];
  const oldIdx = sorted.indexOf(defaultLocale);
  const newIdx = sorted.length - 1;

  sorted.splice(newIdx, 0, sorted.splice(oldIdx, 1)[0]);
  return sorted;
};

module.exports = {
  ensureI18nConfig,
  getI18nConfig,
  getI18nOptions,
  writeI18nOptions,
  getI18nRoutesMap,
  cleanI18nRoutesMap,
  addI18nRoutesMappings,
  ensureLocalisedMessagesFiles,
  getPageContextData,
  extractFromPath,
  isFileToLocalise,
  getTemplateBasename,
  shouldCreateLocalisedPage,
  getPage,
  reorderLocales,
};
