// @ts-check

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { getOptions, getConfig } = require("./options");
const { logger, normaliseUrlPath, normaliseRouteId } = require(".");

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
const routesPath = path.resolve(__dirname, "../.routes/");

/**
 * 
 * @param {{GatsbyI18n.Options}} options
 * @param {string} locale 
 */
const getMessagesPath = ({ messagesPath }, locale) => {
  return path.join(messagesPath, `${locale}.yml`)
}

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
  const { debug, configPath: _configPath } = getI18nOptions();

  configPath = path.join(baseDir, _configPath);

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
const cleanI18nRoutes = () => {
  fs.rmdirSync(routesPath, { recursive: true });
  fs.mkdirSync(routesPath);
};

/**
 * Register i18n route url on cache routes map
 * 
 * This helper can be used from your project for instance to dynamically add
 * localised pages like tags in your project's `gatsby-node.js`
 *
 * @param {string} routeId
 * @param {string} locale
 * @param {string} url
 */
const registerI18nRouteUrl = (routeId, locale, url) => {
  fs.writeFileSync(path.join(routesPath, `${routeId.replace(/\//g, "_")}--${locale}.json`), JSON.stringify({ url }));
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
 * @param {GatsbyI18n.Options} options
 * @param {string} locale
 */
const getMessages = (options, locale) => {
  const fullPath = getMessagesPath(options, locale);

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
 * Ensure that files with translated strings exist, if the don't they are created
 * If a localised messages file (e.g. `en.yml`) does not exist it creates it
 *
 * @param {GatsbyI18n.Config} config
 * @param {GatsbyI18n.Options} options
 */
const ensureLocalisedMessagesFiles = ({ locales }, options) => {
  locales.forEach((locale) => {
    const fullPath = getMessagesPath(options, locale);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, "", "utf-8");
    }
  });
};

/**
 * Get gatsby's page context data
 *
 * @param {string} locale
 * @param {object} [additional]
 * @returns {GatsbyI18n.PageContext}
 */
const getI18nContext = (locale, additional = {}) => {
  const { locales, defaultLocale } = getI18nConfig();
  let options = getI18nOptions();

  locale = locale || defaultLocale;
  const messages = getMessages(options, locale);

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
 * Extract from file path
 *
 * @param {string} fileAbsolutePath
 */
const extractFromFilePath = (fileAbsolutePath) => {
  const { contentPaths } = getI18nOptions();
  let foundContentPath = "";
  if (Array.isArray(contentPaths)) {
    const matches = contentPaths.filter((p) => fileAbsolutePath.includes(p));
    if (matches) {
      foundContentPath = matches[0];
    } else {
      foundContentPath = contentPaths[0];
    }
  }
  const fileRelativePath = fileAbsolutePath.split(foundContentPath)[1];

  return extractPathParts(fileRelativePath);
};

/**
 * Extract path parts
 *
 * The `routeId` matches the src/pages directory structure, which represents the
 * default locale slugs usually
 *
 * Given the file "src/content/my/page/index.en.md" `file`'s properties will be:
 * - `dir` e.g. "/my/page"
 * - `name` e.g. "page"
 * - `locale` e.g. "en"
 *
 * The `locale` can be null here, the default will be assigned later in the
 * `getFileLocale` function, here we don't assume anything, we just parse the
 * file path and extract its parts.
 *
 * @param {string} relativePath
 */
const extractPathParts = (relativePath) => {
  const { locales, defaultLocale } = getI18nConfig();
  let { dir, name } = path.parse(relativePath);
  const nameParts = name.split(".");
  // remove optional locale info from filename, e.g. "index.en.md"
  name = nameParts[0];

  let routeId = name === "index" ? dir : `${dir}/${name}`;
  routeId = normaliseRouteId(routeId);

  let slug = name === "index" ? dir : `${dir}/${name}`;
  slug = normaliseUrlPath(slug);

  // try to grab last name part after dot
  let locale = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;

  // if not specified just assume is the default
  if (!locale) {
    locale = defaultLocale;
  }
  // if specified but not in configured list log an error
  else if (!locales.includes(locale)) {
    logger(
      "error",
      `You need to add the locale ${locale} to the plugin options to render the file ${dir}/${name}`
    );
  }

  return { routeId, slug, locale };
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

/**
 * Gives the URL variant for the given locale and slug according to the current
 * configuration
 *
 * @param {GatsbyI18n.Config} config
 * @param {string} locale
 * @param {string} slug
 */
const localiseUrl = (config, locale, slug) => {
  const urlWithLocale = normaliseUrlPath(`/${locale}/${slug}`);
  const urlWithoutLocale = normaliseUrlPath(`/${slug}`);
  const isLocaleVisible = shouldCreateLocalisedPage(config, locale);

  return isLocaleVisible ? urlWithLocale : urlWithoutLocale;
};

/**
 * Gives the URL for the given locale based on another already localised URL
 * and according to the current configuration
 *
 * @param {GatsbyI18n.Config} config
 * @param {string} locale
 * @param {string} url
 */
const relocaliseUrl = (config, locale, url) => {
  const isLocaleVisible = shouldCreateLocalisedPage(config, locale);
  let foundLocaleInUrl;

  for (let i = 0; i < config.locales.length; i++) {
    const configLocale = config.locales[i];
    if (url.startsWith(`/${configLocale}/`)) {
      foundLocaleInUrl = configLocale;
      break;
    }
  }

  if (isLocaleVisible) {
    if (foundLocaleInUrl) {
      return url.replace(foundLocaleInUrl, locale);
    }
    return normaliseUrlPath(`/${locale}/${url}`);
  }
  if (foundLocaleInUrl) {
    return url.replace(foundLocaleInUrl, "");
  }

  throw new Error("[gatsby-i18n]: Tried to relocalise a url without success");
};

module.exports = {
  ensureI18nConfig,
  getI18nConfig,
  getI18nOptions,
  writeI18nOptions,
  cleanI18nRoutes,
  registerI18nRouteUrl,
  ensureLocalisedMessagesFiles,
  getI18nContext,
  extractFromFilePath,
  getTemplateBasename,
  shouldCreateLocalisedPage,
  reorderLocales,
  localiseUrl,
  relocaliseUrl,
};
