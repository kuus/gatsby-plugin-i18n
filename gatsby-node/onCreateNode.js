var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

// @ts-check
var _require = require("../utils/options"),
    getOptions = _require.getOptions;

var _require2 = require("../utils"),
    logger = _require2.logger,
    normaliseUrlPath = _require2.normaliseUrlPath;

var _require3 = require("../utils/internal"),
    extractFromPath = _require3.extractFromPath,
    isFileToLocalise = _require3.isFileToLocalise;
/**
 * 
 */


var onCreateNode = function onCreateNode(_ref, pluginOptions) {
  var node = _ref.node,
      actions = _ref.actions,
      createNodeId = _ref.createNodeId,
      createContentDigest = _ref.createContentDigest,
      getNode = _ref.getNode;
  var fileAbsolutePath; // file nodes have absolutePath, markdown nodes have fileAbsolutePath

  switch (node.internal.type) {
    case "File":
      // fileAbsolutePath = node.absolutePath;
      // check file extensions otherwise we get a lot of unneeded files
      if ([".md", ".js", ".jsx", ".ts", ".tsx"].indexOf(node.ext) === -1) {
        return;
      }

      break;

    case "MarkdownRemark":
    case "Mdx":
      fileAbsolutePath = node.fileAbsolutePath;
      break;
  } // check for strings that contain slashes, for some reasons here we get
  // absolute paths that are long-seemingly-empty strings


  if (!fileAbsolutePath) return;
  if (!isFileToLocalise(fileAbsolutePath)) return;
  var options = getOptions(pluginOptions);
  var createNodeField = actions.createNodeField;

  var _extractFromPath = extractFromPath(fileAbsolutePath),
      slug = _extractFromPath.slug,
      locale = _extractFromPath.locale,
      routeId = _extractFromPath.routeId,
      fileDir = _extractFromPath.fileDir; // slug can be overriden in each single markdown file


  if (node.frontmatter && node.frontmatter[options.frontmatterKeyForLocalisedSlug]) {
    slug = node.frontmatter[options.frontmatterKeyForLocalisedSlug];
    slug = normaliseUrlPath(slug);
  }

  createNodeField({
    node: node,
    name: "locale",
    value: locale
  });
  createNodeField({
    node: node,
    name: "route",
    value: routeId
  });
  createNodeField({
    node: node,
    name: "slug",
    value: slug
  });
  createNodeField({
    node: node,
    name: "fileDir",
    value: fileDir
  });
  var createNode = actions.createNode,
      createParentChildLink = actions.createParentChildLink;
  var routeNodeId = createNodeId("gatsby-plugin-i18n-route-" + routeId);
  var routeNode = getNode(routeNodeId);

  if (!routeNode) {
    var routeData = {
      routeId: routeId
    };
    routeNode = createNode((0, _extends2.default)({}, routeData, {
      id: routeNodeId,
      parent: null,
      children: [],
      internal: {
        type: "I18nRoute",
        contentDigest: createContentDigest(routeData),
        content: JSON.stringify(routeData),
        description: "Route by gatsby-plugin-i18n"
      }
    }));
  } // createParentChildLink({ parent: routeNode, child: node });


  createNodeField({
    node: routeNode,
    name: locale,
    value: slug
  });

  if (options.debug) {
    logger("info", "locale:" + locale + "; routeId:" + routeId + "; slug:" + slug + "; fileDir:" + fileDir + ";");
  }
};

module.exports = onCreateNode;