// @ts-check

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { getOptions } = require("./options");
const { normaliseUrlPath, normaliseRouteId, findRouteForPath } = require("./utils");

/**
 * @typedef {ReturnType<import("./options").getOptions>} Options
 *
 * @typedef {{ [key: string]: { [key: string]: string } }} RoutesMap
 */

/**
 * Internal logger
 *
 * @param {"log" | "info" | "error" | "warn"} type Console method
 * @param {string} msg Log message
 */
const logger = (type = "log", msg) => {
  console[type](`gatsby-i18n: ${msg}`);
};

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
 * @param {{ options: Options; locale: string; routed?: boolean }} args
 * @param {object} additional
 */
const getPageContextData = ({ options, locale, routed }, additional = {}) => {
  const { locales, defaultLocale } = options || getI18nOptions();
  locale = locale || defaultLocale;
  const messagesPath = ensureLocalisedMessagesFile(options, locale);
  const messages = getMessages(messagesPath);

  return {
    i18n: {
      locales,
      defaultLocale,
      currentLocale: locale,
      routed,
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
 * @param {{ pathContent: string|Array<string>; templateName: string }}
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

const getTemplateBasename = (name) => {
  name = path.basename(name, ".js");
  name = path.basename(name, ".jsx");
  name = path.basename(name, ".tsx");
  return name;
};

/**
 * Here we should create tha same context that we do on `createPages`, it would
 * be better to just create it once here but there is an issue with gatsby that
 * programmatically created pages do not trigger the `onCreatePage` hook,
 * @see https://github.com/gatsbyjs/gatsby/issues/5255
 *
 * The Gatsby docs says in fact: "There is a mechanism in Gatsby to prevent
 * calling onCreatePage for pages created by the same gatsby-node.js to avoid
 * infinite loops/callback."
 *
 * @see https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onCreatePage
 */
const onCreatePage = ({ page, actions }) => {
  const { createPage, createRedirect, deletePage } = actions;
  const options = getI18nOptions();
  const { locales, templateName, excludePaths } = options;
  const normalisedExcludedPaths = excludePaths.map(normaliseUrlPath);
  const oldPage = { ...page };
  const templateBasename = getTemplateBasename(templateName);

  if (page.path.endsWith(`/${templateBasename}/`)) {
    // console.log(`"onCreatePage" page template "${templateBasename}" deleted`);
    deletePage(oldPage);
    // createPage(page);
  } else if (page.path.match(/dev-404/)) {
    // console.log(`"onCreatePage" matched dev-404: ${page.path}`);
    createPage(page);
  } else if (page.path === "/404.html") {
    // console.log(`"onCreatePage" matched 404.html: ${page.path}`);
    deletePage(oldPage);
    createPage(getPage(options, page, null, "404.html", "404.html"));
  } else if (page.path === "/404/") {
    // console.log(`"onCreatePage" matched 404: ${page.path}`);
    deletePage(oldPage);

    const routesMap = /** @type {RoutesMap} */ ({});
    const routeId = normaliseRouteId(page.path);

    if (shouldCreateUnlocalisedPage(options)) {
      createPage(getPage(options, page, null, "404", "404"));
      routesMap[routeId] = routesMap[routeId] || {};
      routesMap[routeId][options.defaultLocale] = normaliseUrlPath(
        page.path
      );
    } else {
      // just always output a translations ready 404.html page with all the i18n
      // page context, some hosting needs it
      createPage(getPage(options, page, null, "404.html", "404.html"));

      createRedirect({
        fromPath: page.path,
        toPath: normaliseUrlPath(`/${options.defaultLocale}/${page.path}`),
        isPermanent: true,
      });
    }
    
    locales.forEach((locale) => {
      // FIXME: last argument`matchPath` should be "*" ?
      if (shouldCreateLocalisedPage(options, locale)) {
        createPage(getPage(options, page, locale, "404"));
        routesMap[routeId] = routesMap[routeId] || {};
        routesMap[routeId][locale] = normaliseUrlPath(`/${locale}/404`);
      }
    });

    addI18nRoutesMappings(routesMap);
  } else {
    // add routes only for pages that loosely placed as `.js/.tsx` files in
    // `src/pages`. For these pages we automatically create the needed localised
    // urls keeping the same slug as the file name (which is what Gatsby uses
    // by default) and the localisation is delegated to the project creator who
    // should use the injectIntl HOC and define the translations in the
    // `src/content/settings/i18n/$locale.yml` files.
    // For the pages not created this way but instead programmatically created
    // in the `createPages` of your project you need instead to manually
    // create the route object and add it through `gatsby-i18n` API
    // `addI18nRoutesMappings`.
    if (page.isCreatedByStatefulCreatePages) {
      if (normalisedExcludedPaths.includes(page.path)) {
        if (options.debug) {
          logger(
            "info",
            `"onCreatePage" matched path to exclude from localisation: ${page.path}`
          );
        }
      } else {
        if (options.debug) {
          logger(
            "info",
            `Page "${page.path}" is deleted in the hook "onCreatePage" and localised`
          );
        }
        const routesMap = /** @type {RoutesMap} */ ({});
        const routeId = normaliseRouteId(page.path);

        // first always delete
        deletePage(oldPage);

        // then produce the localised pages according to the current i18n options
        if (shouldCreateUnlocalisedPage(options)) {
          createPage(getPage(options, page, null, page.path));
          routesMap[routeId] = routesMap[routeId] || {};
          routesMap[routeId][options.defaultLocale] = normaliseUrlPath(
            page.path
          );
        } else {
          createRedirect({
            fromPath: page.path,
            toPath: normaliseUrlPath(`/${options.defaultLocale}/${page.path}`),
            isPermanent: true,
          });
        }

        locales.forEach((locale) => {
          if (shouldCreateLocalisedPage(options, locale)) {
            routesMap[routeId] = routesMap[routeId] || {};
            routesMap[routeId][locale] = normaliseUrlPath(
              `/${locale}/${page.path}`
            );
            createPage(getPage(options, page, locale, page.path));
          }
        });
        addI18nRoutesMappings(routesMap);
      }
    }
  }
};

/**
 * 
 * @param {Options} options 
 * @param {string} [locale] 
 */
const shouldCreateUnlocalisedPage = (options, locale) => {
  locale = locale || options.defaultLocale;

  if (locale === options.defaultLocale && options.hideDefaultLocaleInUrl) {
    return true;
  }
  return false;
}

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
}

/**
 *
 * @param {Options} options
 * @param {any} page
 * @param {string} [locale]
 * @param {string} [path]
 * @param {string} [matchPath]
 */
const getPage = (options, page, locale, path, matchPath) => {
  const hasWildcard = matchPath ? matchPath.indexOf("*") >= 0 : false;
  const data = {
    ...page,
    context: {
      ...page.context,
      ...getPageContextData({ options, locale, routed: !!locale }),
    },
  };
  path = locale ? `/${locale}/${path}` : `/${path}`;
  data.path = normaliseUrlPath(path);

  if (matchPath) {
    matchPath = locale ? `/${locale}/${matchPath}` : `/${matchPath}`;
    // don't add trailing slash to 404 wildcard match path, otherwise we would
    // have the following matchPath value: `/en/*/`
    matchPath = hasWildcard ? matchPath : normaliseUrlPath(matchPath);
    data.matchPath = matchPath;
  }

  return data;
};

module.exports = {
  logger,
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
  onCreatePage,
  shouldCreateUnlocalisedPage,
  shouldCreateLocalisedPage
};
