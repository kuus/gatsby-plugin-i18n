const { getOptions } = require("./options");
const { logger } = require("./utils");
const {
  extractFromPath,
  normaliseUrlPath,
  isFileToLocalise,
} = require("./utils-plugin");

const onCreateNode = ({ node, actions }, pluginOptions) => {
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

  const options = getOptions(pluginOptions);

  if (!isFileToLocalise(options, fileAbsolutePath)) return;

  const { createNodeField } = actions;
  let { slug, locale, route, fileDir } = extractFromPath({
    options,
    fileAbsolutePath,
  });

  // slug can be overriden in each single markdown file
  if (
    node.frontmatter &&
    node.frontmatter[options.frontmatterKeyForLocalisedSlug]
  ) {
    slug = node.frontmatter[options.frontmatterKeyForLocalisedSlug];
    slug = normaliseUrlPath(slug);
  }

  createNodeField({ node, name: "locale", value: locale });
  createNodeField({ node, name: "route", value: route });
  createNodeField({ node, name: "slug", value: slug });
  createNodeField({ node, name: "fileDir", value: fileDir });

  if (options.debug) {
    logger(
      "info",
      `locale:${locale}; route:${route}; slug:${slug}; fileDir:${fileDir};`
    );
  }
};

module.exports = onCreateNode;
