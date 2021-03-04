const fs = require("fs");
const path = require("path");
const { getOptions } = require("./options");
const { normaliseSlashes, findRouteForPath } = require("./utils");

const PATH_DATA = "src/data/i18n";

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
    logger("error", `Failed to write file ${PATH_DATA}/routes.json`);
  }
};

const addRoutes = (data) => {
  const existingRoutes = readRoutes();
  writeRoutes({ ...existingRoutes, ...data });
};

const getConfigPath = () => {
  return path.resolve(`${PATH_DATA}/config.json`);
};

const readConfig = () => {
  const { defaultLanguage, languages } = getOptions();
  let config = {
    defaultLanguage,
    languages,
  };
  try {
    config = require(getConfigPath());
  } catch (e) {
    logger("error", `Missing file ${PATH_DATA}/config.json`);
  }

  return config;
};

const writeConfig = (pluginOptions) => {
  const { defaultLanguage, languages } = getOptions(pluginOptions);
  const config = { defaultLanguage, languages };

  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    logger("error", `Failed to write file ${PATH_DATA}/config.json`);
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

const getMessages = (fullPath, language) => {
  try {
    // TODO load yaml here
    const messages = require(fullPath);

    return flattenMessages(messages);
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      process.env.NODE_ENV !== "test" &&
        console.error(`[gatsby-i18n] couldn't find file "${fullPath}"`);
    }

    throw error;
  }
};

const getPageContextData = ({ lang, routed }, additional = {}) => {
  const { languages, defaultLanguage } = readConfig();
  lang = lang || defaultLanguage;
  const messages = getMessages(path.resolve(`${PATH_DATA}/${lang}.json`), lang);

  return {
    i18n: {
      languages,
      defaultLanguage,
      currentLanguage: lang,
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
 * - `lang` will be e.g. "en"
 * - `fileDir` will be e.g. "/my/page"
 */
const extractFromPath = ({ options, fileAbsolutePath }) => {
  const file = extractFileParts({ options, fileAbsolutePath });
  const route = getFileRouteId({ options, file });
  const slug = getFileSlug({ options, file });
  const lang = getFileLang({ options, file });

  return { route, slug, lang, fileDir: file.dir };
};

/**
 * Extract file parts
 *
 * Given the file "/my/page/index.en.md" `file`'s properties will be:
 * - `dir` e.g. "/my/page"
 * - `name` e.g. "page"
 * - `lang` e.g. "en"
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
  // remove optional lang info from filename, e.g. "index.en.md"
  name = nameChunks[0];
  // grab last name part after dot or return `null` if language is not specified
  const lang = nameChunks.length > 1 ? nameChunks[nameChunks.length - 1] : null;

  return { dir, name, lang };
};

// matches the src/pages directory structure, which represents the default
// language slugs usually
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

const getFileLang = ({ options, file }) => {
  const { languages, defaultLanguage } = options;
  let lang = defaultLanguage;

  if (file.lang) {
    if (languages.includes(file.lang)) {
      lang = file.lang;
    } else {
      // TODO: proper logging
      console.error(
        `You need to add the language ${file.lang} to the plugin options`
      );
    }
  }

  return lang;
};

/**
 * Is file to localise?
 *
 * It checks that the given file path is within the `pathContent` defined in the
 * plugin options and that it is not a template
 *
 * @param {string|Array<string>} { pathContent }
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
};
