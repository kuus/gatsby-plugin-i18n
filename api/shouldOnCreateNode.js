// @ts-check

const path = require("path");
const { getOptions } = require("../utils/options");

/**
 *
 */
const shouldOnCreateNode = ({ node }, pluginOptions) => {
  let nodePath;

  // file nodes have absolutePath, markdown nodes have nodePath
  switch (node.internal.type) {
    case "File":
      nodePath = node.absolutePath;
      break;
    case "MarkdownRemark":
    case "Mdx":
      nodePath = node.fileAbsolutePath;
      break;
  }

  if (!nodePath) {
    return false;
  }

  const { name, ext } = path.parse(nodePath);

  // disregard File nodes other than mdx and templates, `.md` files are just
  // treated generally speaking as Markdown nodes
  if (node.internal.type === "File" && ![".mdx", ".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
    return false;
  }

  const { contentPaths, templateName } = getOptions(pluginOptions);

  // template files do not need to be localised
  if (name === templateName) {
    return false;
  }

  // check that the file path is within the `contentPaths` option
  if (typeof contentPaths === "string") {
    if (nodePath.includes(contentPaths)) {
      return true;
    }
  } else if (Array.isArray(contentPaths)) {
    for (let i = 0; i < contentPaths.length; i++) {
      if (nodePath.includes(contentPaths[i])) {
        return true;
      }
    }
  }

  return false;
};

module.exports = shouldOnCreateNode;
