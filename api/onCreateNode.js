// @ts-check

const fs = require("fs");
const path = require("path");
const { getOptions } = require("../utils/options");
const { logger, normaliseUrlPath } = require("../utils");
const {
  extractFromFilePath,
  getI18nConfig,
  localiseUrl,
  registerI18nRouteUrl,
} = require("../utils/internal");
const { getSlugsFromComment } = require("../utils/parseSourceComment");

/**
 * @param {GatsbyI18n.Config} config
 * @param {string} absolutePath
 */
const getFileRouteComponents = (config, absolutePath) => {
  const output = {};
  // look for a localised component name for this absolutePath, for instance
  // look for `/my-page/index.it.tsx` given the absolutePath `/my-page/index.tsx`
  const { dir, ext, name } = path.parse(absolutePath);
  let nameCleaned = name;

  config.locales.forEach((locale) => {
    if (name.endsWith(`.${locale}`)) {
      nameCleaned = name.replace(`.${locale}`, "");
    }
  });

  config.locales.forEach((locale) => {
    const pathToCheck = path.format({
      dir,
      name: `${nameCleaned}.${locale}`,
      ext,
    });
    if (fs.existsSync(pathToCheck)) {
      output[locale] = pathToCheck;
    }
  });

  const pathToCheckUnsuffixed = path.format({
    dir,
    name: nameCleaned,
    ext,
  });

  if (fs.existsSync(pathToCheckUnsuffixed)) {
    output[config.defaultLocale] = pathToCheckUnsuffixed;
  }

  return output;
};

/**
 * @typedef {{
 *   absolutePath: string;
 *   fileAbsolutePath?: undefined;
 *   frontmatter?: undefined;
 * }} FileNode
 *
 * @typedef {{
 *  absolutePath?: undefined;
 *  fileAbsolutePath: string;
 *  frontmatter: {
 *    template?: string;
 *  }
 * }} MarkdownNode
 *
 * @param {GatsbyI18n.Options} options
 * @param {GatsbyI18n.Config} config
 * @param {FileNode | MarkdownNode} node Either File or Markdown node
 * @returns {string}
 */
const getMarkdownRouteComponent = (
  options,
  { absolutePath, fileAbsolutePath, frontmatter }
) => {
  let component;

  if (absolutePath) {
    return path.resolve(absolutePath);
  }

  if (frontmatter.template) {
    const defaultDir = "src/templates";
    // TODO: js/ts format support
    component = path.resolve(defaultDir, `${frontmatter.template}.tsx`);
  } else {
    const { templateName } = options;
    const relativeDir = path.dirname(fileAbsolutePath);
    component = path.resolve(relativeDir, templateName);
  }

  if (!fs.existsSync(component)) {
    logger("warn", `No template component found for ${fileAbsolutePath}`);
  }

  return component;
};

/**
 *
 */
const onCreateNode = async (
  {
    node,
    actions,
    createNodeId,
    createContentDigest,
    getNode,
    getNodes,
    loadNodeContent,
  },
  pluginOptions
) => {
  const { createNodeField } = actions;
  const options = getOptions(pluginOptions);
  const config = getI18nConfig();

  // TODO: respect this option:
  // const normalisedExcludedPaths = excludePaths.map(normaliseUrlPath);
  // normalisedExcludedPaths

  const isFile = node.internal.type === "File";
  const isMarkdown = !isFile; // ["MarkdownRemark", "Mdx"].includes(node.internal.type);
  // file nodes have absolutePath, markdown nodes have nodePath
  const nodePath = isFile ? node.absolutePath : node.fileAbsolutePath;
  const nodeId = node.id;
  const nodeData = {
    ...extractFromFilePath(nodePath),
    urls: [],
  };
  let localesManagedByNode = [];
  let isRouteNode;

  // Manage File node
  if (isFile) {
    isRouteNode = true;
    const textContent = await loadNodeContent(node);
    const parsedSlugs = getSlugsFromComment(textContent);
    const localisedComponents = getFileRouteComponents(config, nodePath);

    // the same File node is responsible for multiple locales only if it does
    // not have a specific component for each of them
    localesManagedByNode =
      Object.keys(localisedComponents).length === 1
        ? config.locales
        : [nodeData.locale];

    // slug overriding, we iterate over all the locales as File nodes always
    // have all locales since they can always just use the hook `useI18n` and
    // translate their strings
    localesManagedByNode.forEach((locale) => {
      // add custom routes urls retrieved from special I18n comment
      // or add route urls based on the info extracted from the node file path
      const url = localiseUrl(
        config,
        locale,
        parsedSlugs[locale] || nodeData.slug
      );
      const component = localisedComponents[locale] || nodePath;

      // add urls to register for this same node
      nodeData.urls.push({ locale, url, component, nodeId });
    });
  }
  // Manage Markdown node, these nodes must always be one per locale, if one is
  // missing the page will be considered untranslated
  else if (isMarkdown) {
    // slug overriding: markdown
    if (node.frontmatter) {
      // not every markdown necessarily need to render into a page route, just
      // those that specify a template name...
      if (node.frontmatter.template) {
        isRouteNode = true;
      }
      // ...or a slug, and with slugs localised urls can be overriden in each
      // single markdown file
      if (node.frontmatter[options.frontmatterKeyForLocalisedSlug]) {
        isRouteNode = true;
        nodeData.slug = normaliseUrlPath(
          node.frontmatter[options.frontmatterKeyForLocalisedSlug]
        );
      }
    }

    // We can add the locale to every md node despite they are route nodes or
    // not, for instance it might be useful to retrieve by locale some markdown
    // files used as collection data related to another will-be-page collection
    localesManagedByNode = [nodeData.locale];

    // add url data merging to those existing for this same routeId
    if (isRouteNode) {
      const component = getMarkdownRouteComponent(options, node);
      const url = localiseUrl(config, nodeData.locale, nodeData.slug);

      nodeData.urls = [{ locale: nodeData.locale, url, component, nodeId }];
    }
  }

  // Nodes can belong to multiple locales.
  // a File node usually belong to different locales, but they can be suffixed
  // too to create a special route for a specific language so we cannot just
  // set the same field with all the locales, but we need to incrementally add
  // them on each node, we simplify the way to consume this through a custom
  // fieldExtension->reolsver in `createSchemaCustomization`
  localesManagedByNode.forEach((locale) => {
    createNodeField({
      node,
      name: `locale_${locale}`,
      value: locale,
    });
  });

  // enter here only nodes that will become routes
  if (isRouteNode) {
    // register route on routes cache file
    nodeData.urls.forEach((urlData) => {
      registerI18nRouteUrl(nodeData.routeId, urlData.locale, urlData.url);

      if (options.debug) {
        logger(
          "info",
          `(onCreateNode) {${node.internal.type}} routeId:${nodeData.routeId} (${urlData.locale}): ${urlData.url}`
        );
      }
    });

    // create node fields common to File and Markdown nodes
    createNodeField({ node, name: "routeId", value: nodeData.routeId });

    const { createNode, createParentChildLink } = actions;
    const routeNodeId = createNodeId(
      `gatsby-plugin-i18n-route-${nodeData.routeId}`
    );
    const routeNodeData = { routeId: nodeData.routeId };

    // create special route node if it does not exists yet
    if (!getNode(routeNodeId)) {
      await createNode({
        ...routeNodeData,
        id: routeNodeId,
        internal: {
          type: "I18nRoute",
          contentDigest: createContentDigest(routeNodeData),
          content: JSON.stringify(routeNodeData),
          description: "Route node by gatsby-plugin-i18n",
        },
      });
    }

    const routeNode = getNode(routeNodeId);

    // add urls fields on special route node
    nodeData.urls.forEach((urlData) => {
      createNodeField({
        node: routeNode,
        name: urlData.locale,
        value: urlData,
      });
    });

    // attach the route node as child of the content/page node
    createParentChildLink({ parent: node, child: routeNode });
  }
};

module.exports = onCreateNode;
