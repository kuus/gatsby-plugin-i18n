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
  let fileAbsolutePath;

  // file nodes have absolutePath, markdown nodes have fileAbsolutePath
  switch (node.internal.type) {
    case "File":
      fileAbsolutePath = node.absolutePath;

      // check file extensions otherwise we get a lot of unneeded files
      if ([".md", ".js", ".jsx", ".ts", ".tsx"].indexOf(node.ext) === -1) {
        return;
      }
      break;
    case "MarkdownRemark":
    case "Mdx":
      fileAbsolutePath = node.fileAbsolutePath;
      break;
  }

  // check for strings that contain slashes, for some reasons here we get
  // absolute paths that are long-seemingly-empty strings
  if (!fileAbsolutePath) return;

  if (!isFileToLocalise(fileAbsolutePath)) return;

  const options = getOptions(pluginOptions);
  const { createNodeField } = actions;
  let { slug, locale, routeId, fileDir } = extractFromPath(fileAbsolutePath);

  // slug can be overriden in each single markdown file
  if (
    node.frontmatter &&
    node.frontmatter[options.frontmatterKeyForLocalisedSlug]
  ) {
    slug = node.frontmatter[options.frontmatterKeyForLocalisedSlug];
    slug = normaliseUrlPath(slug);
  }

  createNodeField({ node, name: "locale", value: locale });
  createNodeField({ node, name: "route", value: routeId });
  createNodeField({ node, name: "slug", value: slug });
  createNodeField({ node, name: "fileDir", value: fileDir });

  const { createNode, createParentChildLink } = actions;
  const routeNodeId = createNodeId(`gatsby-plugin-i18n-route-${routeId}`);

  if (!getNode(routeNodeId)) {
    const routeData = { routeId };

    await createNode({
      ...routeData,
      id: routeNodeId,
      parent: null,
      children: [],
      internal: {
        type: "I18nRoute",
        contentDigest: createContentDigest(routeData),
        content: JSON.stringify(routeData),
        description: "Route by gatsby-plugin-i18n",
      },
    });
  }

  createNodeField({
    node: getNode(routeNodeId),
    name: locale,
    value: getUrlData(getI18nConfig(), locale, slug).url,
  });

  // createParentChildLink({ parent: routeNode, child: node });

  if (options.debug) {
    logger(
      "info",
      `locale:${locale}; routeId:${routeId}; slug:${slug}; fileDir:${fileDir};`
    );
  }
};

module.exports = onCreateNode;
