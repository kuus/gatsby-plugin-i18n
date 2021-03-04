// const nodePath = require("path");
const { getOptions } = require("./options");
const {
  extractFromPath,
  normaliseSlashes,
  isFileToLocalise,
} = require("./utils-plugin");

const onCreateNode = ({ node, actions }, pluginOptions) => {
  let fileAbsolutePath;

  // file nodes have absolutePath, markdown nodes have fileAbsolutePath
  switch (node.internal.type) {
    case "File":
      fileAbsolutePath = node.absolutePath;

      // check file extensions otherwise we get a lot of unneded files
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
  let { slug, lang, route, fileDir } = extractFromPath({
    options,
    fileAbsolutePath,
  });

  // slug can be overriden in each single markdown file
  if (node.frontmatter && node.frontmatter.url) {
    slug = node.frontmatter.url;
  }

  slug = normaliseSlashes(slug);
  route = normaliseSlashes(route);

  createNodeField({ node, name: "lang", value: lang });
  createNodeField({ node, name: "route", value: route });
  createNodeField({ node, name: "slug", value: slug });
  createNodeField({ node, name: "fileDir", value: fileDir });

  if (options.debug) {
    console.log(
      `[gatsby-i18n] lang:${lang}; route:${route}; slug:${slug}; fileDir:${fileDir};`
    );
  }
};

module.exports = onCreateNode;
