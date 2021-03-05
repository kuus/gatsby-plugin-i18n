const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { getOptions } = require("./options");
const { normaliseSlashes, findRouteForPath } = require("./utils");

/**
 * @typedef {ReturnType<import("./options").getOptions>} Options
 */

const logger = (type = "log", msg) => {
  console[type](`gatsby-i18n: ${msg}`);
};

// const getRoutesProjectPath = () => {
//   return path.resolve(`${PATH_DATA}/routes.json`);
// };

const getRoutesPath = () => {
  return `${__dirname}/.routes.json`;
};

const cleanRoutes = () => {
  writeRoutes({});
};

const readRoutes = () => {
  const filePath = getRoutesPath();
  let existingRoutes = {};
  try {
    existingRoutes = JSON.parse(fs.readFileSync(filePath));
  } catch (e) {
    logger("warn", `Failed to read file ${filePath}`);
  }

  return existingRoutes;
};

const writeRoutes = (data) => {
  try {
    // FIXME: decide where to write the routes file or explain why keep both
    // fs.writeFileSync(getRoutesProjectPath(), JSON.stringify(data, null, 2), "utf-8");
    fs.writeFileSync(getRoutesPath(), JSON.stringify(data), "utf-8");
  } catch (e) {
    logger("error", `Failed to write file ${getRoutesPath()}`);
  }
};

const addRoutes = (data) => {
  const existingRoutes = readRoutes();
  writeRoutes({ ...existingRoutes, ...data });
};

/**
 * @param {Options} options
 */
// const readConfig = (pluginOptions) => {
//   const { defaultLocale, locales, pathData } = getOptions(pluginOptions);
//   let config = {
//     defaultLocale,
//     locales,
//   };
//   try {
//     config = require(path.resolve(`${pathData}/config.yml`));
//   } catch (e) {
//     logger("error", `Missing file ${pathData}/config.yml`);
//   }

//   return config;
// };

/**
 * @param {Options} options
 */
const writeConfig = (pluginOptions) => {
  const { defaultLocale, locales, pathData } = getOptions(pluginOptions);
  const config = { defaultLocale, locales };
  const content = yaml.dump(config);
  try {
    fs.writeFileSync(path.resolve(`${pathData}/config.yml`), content, "utf-8");
  } catch (e) {
    logger("error", `Failed to write file ${pathData}/config.yml`);
  }

  return config;
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
 * @param {Options} options
 * @param {string} locale
 */
const ensureLocalisedMessagesFile = (options, locale) => {
  const fullPath = path.join(options.pathData, `${locale}.yml`);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, "", "utf-8");
  }

  return fullPath;
};

/**
 * @param {Options} pluginOptions
 */
const ensureLocalisedMessagesFiles = (pluginOptions) => {
  const options = getOptions(pluginOptions);
  options.locales.forEach((locale) => {
    ensureLocalisedMessagesFile(options, locale);
  });
};

/**
 * @param {{ options: Options; locale: string; routed?: boolean }}
 * @param {object}} additional
 */
const getPageContextData = ({ options, locale, routed }, additional = {}) => {
  // const { locales, defaultLocale } = readConfig(options);
  const { locales, defaultLocale } = options;
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
 * @param {{ options: Options; fileAbsolutePath: string }}
 */
const extractFromPath = ({ options, fileAbsolutePath }) => {
  const file = extractFileParts({ options, fileAbsolutePath });
  const route = getFileRouteId({ options, file });
  const slug = getFileSlug({ options, file });
  const locale = getFileLocale({ options, file });

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
 * @param {{ options: Options; fileAbsolutePath: string }}
 */
const extractFileParts = ({ options, fileAbsolutePath }) => {
  const { pathContent } = options;
  let rightContentPath = pathContent;
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

// matches the src/pages directory structure, which represents the default
// locale slugs usually
const getFileRouteId = ({ file }) => {
  let { dir, name } = file;
  let route = name === "index" ? dir : `${dir}/${name}`;
  route = normaliseSlashes(route);
  return route;

  // TODO: decide whether to normalise instead the routes keys so to have e.g.
  // "parent-page" instead of "/parent/page":
  // let route = name === "index" ? dir : dir + "-" + name;
  // route = route.replace(/\//g, "-").replace(/^-/, "");
  // return route || "index";
};

const getFileSlug = ({ file }) => {
  let { dir, name } = file;
  let slug = name === "index" ? dir : `${dir}/${name}`;
  slug = normaliseSlashes(slug);
  return slug;
};

const getFileLocale = ({ options, file }) => {
  const { locales, defaultLocale } = options;
  let locale = defaultLocale;

  if (file.locale) {
    if (locales.includes(file.locale)) {
      locale = file.locale;
    } else {
      logger(
        "error"`You need to add the locale ${file.locale} to the plugin options`
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

module.exports = {
  logger,
  cleanRoutes,
  addRoutes,
  writeConfig,
  getPageContextData,
  extractFromPath,
  isFileToLocalise,
  getTemplateBasename,
  normaliseSlashes,
  findRouteForPath,
  ensureLocalisedMessagesFiles,
};
