// @ts-check

const fs = require("fs");
const path = require("path");
const { getOptions } = require("../utils/options");
const { logger, normaliseUrlPath } = require("../utils");
const {
  extractFromFilePath,
  getI18nConfig,
  localiseUrl,
} = require("../utils/internal");
const { getSlugsFromComment } = require("../utils/parseSourceComment");

/**
 * @param {GatsbyI18n.I18n} i18n
 * @param {string} absolutePath
 */
const getFileRouteComponents = (i18n, absolutePath) => {
  const output = {};
  // look for a localised component name for this absolutePath, for instance
  // look for `/my-page/index.it.tsx` given the absolutePath `/my-page/index.tsx`
  const { dir, ext, name } = path.parse(absolutePath);
  let nameCleaned = name;

  i18n.locales.forEach((locale) => {
    if (name.endsWith(`.${locale}`)) {
      nameCleaned = name.replace(`.${locale}`, "");
    }
  });

  i18n.locales.forEach((locale) => {
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
    output[i18n.defaultLocale] = pathToCheckUnsuffixed;
  }

  return output;
};

/**
 * @param {GatsbyI18n.Options} options
 * @param {string} fileAbsolutePath
 * @param {{ template?: string; }} localisedFrontmatter
 * @returns {string}
 */
const getMarkdownRouteComponent = (
  options,
  fileAbsolutePath,
  localisedFrontmatter
) => {
  const { debug, templateName } = options;
  let component;

  if (localisedFrontmatter.template) {
    const defaultDir = "src/templates";
    // TODO: js/ts format support
    component = path.resolve(
      defaultDir,
      `${localisedFrontmatter.template}.tsx`
    );
  } else {
    const relativeDir = path.dirname(fileAbsolutePath);
    component = path.resolve(relativeDir, templateName);
  }

  if (debug && !fs.existsSync(component)) {
    logger("warn", `No template component found for ${fileAbsolutePath}`);
  }

  return component;
};

/**
 * @typedef {import("gatsby").Node} NodeOriginal
 *
 * @typedef {{
 *   id: string;
 *   internal: {
 *     type: "File";
 *   };
 *  absolutePath: string;
 * }} FileNode
 *
 * @typedef {{
 *   id: string;
 *   internal: {
 *     type: "MarkdownRemark" | "Mdx";
 *   };
 *   fileAbsolutePath: string;
 *   frontmatter?: {
 *     template?: string;
 *     identifier?: string;
 *   }
 * }} MarkdownNode
 */

/**
 * @param {import("gatsby").CreateNodeArgs<FileNode | MarkdownNode>} args
 */
const onCreateNode = async (
  {
    node,
    actions,
    createNodeId,
    createContentDigest,
    getNode,
    loadNodeContent,
  },
  pluginOptions
) => {
  const { createNodeField } = actions;
  const options = getOptions(pluginOptions);
  const i18n = getI18nConfig();
  let nodePath = "";
  // TODO: respect this option:
  // const normalisedExcludedPaths = excludePaths.map(normaliseUrlPath);
  // normalisedExcludedPaths

  if (node.internal.type === "File") {
    nodePath = /** @type {FileNode} */ (node).absolutePath;
  } else {
    nodePath = /** @type {MarkdownNode} */ (node).fileAbsolutePath;
  }

  const isFile = node.internal.type === "File";
  const isMarkdown = !isFile; // ["MarkdownRemark", "Mdx"].includes(node.internal.type);
  // file nodes have absolutePath, markdown nodes have nodePath
  // const nodePath = isFile ? node.absolutePath : node.fileAbsolutePath;
  const nodeId = node.id;
  const nodeData = {
    ...extractFromFilePath(nodePath),
    urls: [],
    context: {},
  };
  let localesManagedByNode = [];
  let isRouteNode;
  let shouldQuit = false;

  // Manage File node
  if (isFile) {
    isRouteNode = true;
    const nodeContent = await loadNodeContent(node);
    const customSlugs = getSlugsFromComment(nodeContent);
    const localisedComponents = getFileRouteComponents(i18n, nodePath);

    // the same File node is responsible for multiple locales only if it does
    // not have a specific component for each of them
    localesManagedByNode =
      Object.keys(localisedComponents).length === 1
        ? i18n.locales
        : [i18n.defaultLocale];

    // slug overriding, we iterate over all the locales as File nodes always
    // have all locales since they can always just use the hook `useI18n` and
    // translate their strings
    localesManagedByNode.forEach((locale) => {
      // add custom routes urls retrieved from special I18n comment
      // or add route urls based on the info extracted from the node file path
      const url = localiseUrl(
        i18n,
        locale,
        customSlugs[locale] || nodeData.slug
      );
      const component = localisedComponents[locale] || nodePath;

      // add urls to register for this same node
      nodeData.urls.push({ locale, url, component, nodeId });
    });
  }
  // Manage Markdown node, these nodes must always be one per locale, if one is
  // missing the page will be considered untranslated
  else if (isMarkdown) {
    const customSlugs = {};
    const { frontmatter, fileAbsolutePath } = /** @type {MarkdownNode} */ (
      node
    );

    // we get here only if the Markdown node file specify the locale in its file
    // name, e.g. `/my-page/index.en.md`
    if (nodeData.locale) {
      // slug overriding
      if (frontmatter) {
        // not every markdown necessarily need to render into a page route, just
        // those that specify a template name or a slug
        if (frontmatter && frontmatter.template) {
          isRouteNode = true;
        }
        // with a special frontmatter key localised urls can be overriden in each
        // single markdown file
        if (frontmatter[options.frontmatterKeyForLocalisedSlug]) {
          isRouteNode = true;
          customSlugs[nodeData.locale] = normaliseUrlPath(
            frontmatter[options.frontmatterKeyForLocalisedSlug]
          );
        }
        if (frontmatter[options.frontmatterKeyForIdentifier]) {
          nodeData.context.identifier =
            frontmatter[options.frontmatterKeyForIdentifier];
        }
      }

      // We can add the locale to every md node despite they are route nodes or
      // not, for instance it might be useful to retrieve by locale some markdown
      // files used as collection data related to another will-be-page collection
      localesManagedByNode = [nodeData.locale];
    } else {
      // we gather the locales manage by this node by reading the frontmatter
      // root keys, for netlify files collection (not folders) the frontmatter
      // will in fact look like
      // ---
      // en:
      //   template: collection-file
      //   title: Privacy policy
      // it:
      //   template: collection-file
      //   title: Privacy
      // ---
      if (frontmatter) {
        localesManagedByNode = Object.keys(frontmatter).filter((key) =>
          i18n.locales.includes(key)
        );
        shouldQuit = true;

        // slug overriding
        localesManagedByNode.forEach((locale) => {
          // if (frontmatter[locale].template) {
          //   isRouteNode = true;
          // }
          // if (
          //   frontmatter[locale][options.frontmatterKeyForLocalisedSlug]
          // ) {
          //   isRouteNode = true;
          //   customSlugs[locale] = normaliseUrlPath(
          //     frontmatter[locale][options.frontmatterKeyForLocalisedSlug]
          //   );
          // }

          console.log(
            "fake markdown file for nested localised body field to be picked up by MDX"
          );

          const yaml = require("js-yaml");
          const { body: fakedBody, ...fakedFrontmatter } = frontmatter[locale];
          let fakeMdContent = "---\n";
          fakeMdContent += yaml.dump(fakedFrontmatter);
          fakeMdContent += "---\n\n";
          fakeMdContent += fakedBody;
          fs.writeFileSync(
            nodePath.replace("index.md", `.index.${locale}.md`),
            fakeMdContent,
            "utf-8"
          );
        });

        // we have created separate nodes, we can create the all-encompassing-locales
        // one
        actions.deleteNode(node);
        // return;
      }
    }

    if (shouldQuit) return;

    localesManagedByNode.forEach((locale) => {
      const url = localiseUrl(
        i18n,
        locale,
        customSlugs[locale] || nodeData.slug
      );
      const component = getMarkdownRouteComponent(
        options,
        fileAbsolutePath,
        frontmatter[locale] || frontmatter
      );

      // add urls to register for this same node
      nodeData.urls.push({ locale, url, component, nodeId });
    });
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
    // create node fields common to File and Markdown nodes
    createNodeField({ node, name: "routeId", value: nodeData.routeId });

    const { createNode, createParentChildLink } = actions;
    const routeNodeId = createNodeId(
      `gatsby-plugin-i18n-route-${nodeData.routeId}`
    );
    const routeNodeData = {
      routeId: nodeData.routeId,
      context: nodeData.context,
    };

    // create special route node if it does not exists yet
    if (!getNode(routeNodeId)) {
      createNode({
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
