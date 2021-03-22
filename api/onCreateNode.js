// @ts-check

const { getOptions } = require("../utils/options");
const { logger, normaliseUrlPath } = require("../utils");
const {
  extractFromPath,
  isFileToLocalise,
  getI18nConfig,
  getUrlData,
} = require("../utils/internal");

/**
 *
 */
const onCreateNode = async (
  { node, actions, createNodeId, createContentDigest, getNode },
  pluginOptions
) => {
  let isRouteNode;
  let nodeFilePath;

  // file nodes have absolutePath, markdown nodes have nodeFilePath
  switch (node.internal.type) {
    case "File":
      nodeFilePath = node.absolutePath;
      isRouteNode = true;

      // check file extensions otherwise we get a lot of unneeded files
      if ([".js", ".jsx", ".ts", ".tsx"].indexOf(node.ext) === -1) {
        return;
      }
      break;
    case "MarkdownRemark":
    case "Mdx":
      nodeFilePath = node.fileAbsolutePath;
      break;
  }

  if (!isFileToLocalise(nodeFilePath)) return;

  const { createNodeField } = actions;
  const { frontmatterKeyForLocalisedSlug, debug } = getOptions(pluginOptions);
  let { slug, locale, routeId } = extractFromPath(nodeFilePath);

  if (node.frontmatter) {
    // not every markdown necesseraly need to render into a page route, just
    // those that specify a template name...
    if (node.frontmatter.template) {
      isRouteNode = true;
    }
    // ...or a slug, and with slugs localised urls can be overriden in each
    // single markdown file
    if (node.frontmatter[frontmatterKeyForLocalisedSlug]) {
      isRouteNode = true;
      slug = node.frontmatter[frontmatterKeyForLocalisedSlug];
      slug = normaliseUrlPath(slug);
    }
  }
  
  // we can add the locale to every node despite they are route nodes or not,
  // for instance it might be useful to retrive by locale some markdown files
  // used as collection data related to another will-be-page collection
  createNodeField({ node, name: "locale", value: locale });
  
  if (isRouteNode) {
    const url = getUrlData(getI18nConfig(), locale, slug).url;

    createNodeField({ node, name: "route", value: routeId });
    createNodeField({ node, name: "slug", value: slug });
    createNodeField({ node, name: "url", value: url });

    const { createNode, createParentChildLink } = actions;
    const routeNodeId = createNodeId(`gatsby-plugin-i18n-route-${routeId}`);
  
    if (!getNode(routeNodeId)) {
      const routeData = { routeId };
  
      await createNode({
        ...routeData,
        id: routeNodeId,
        parent: node.id,
        children: [],
        internal: {
          type: "I18nRoute",
          contentDigest: createContentDigest(routeData),
          content: JSON.stringify(routeData),
          description: "Route node by gatsby-plugin-i18n",
        },
      });
    }
  
    createNodeField({
      node: getNode(routeNodeId),
      name: locale,
      value: url,
    });
  
    // attach the route node as child of the content/page node
    // @see https://www.gatsbyjs.com/docs/reference/config-files/actions/#createParentChildLink
    const routeNode = getNode(routeNodeId);
    createParentChildLink({ parent: node, child: routeNode });
  }

  if (debug) {
    logger(
      "info",
      `locale:${locale}; routeId:${routeId}; slug:${slug};`
    );
  }
};

module.exports = onCreateNode;
