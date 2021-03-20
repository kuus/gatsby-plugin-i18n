var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

// @ts-check
var _require = require("../utils/internal"),
    getI18nOptions = _require.getI18nOptions,
    getI18nConfig = _require.getI18nConfig,
    getI18nRoutesMap = _require.getI18nRoutesMap; // const { getOptions } = require("../utils/options");


var sourceNodes = function sourceNodes(_ref, customOptions) {
  var actions = _ref.actions,
      createContentDigest = _ref.createContentDigest,
      createNodeId = _ref.createNodeId;
  var createNode = actions.createNode; // const options = getOptions(customOptions);

  var options = getI18nOptions(); // const config = require(options.configPath);

  var config = getI18nConfig();
  var configNode = (0, _extends2.default)({}, options, config);
  createNode((0, _extends2.default)({}, configNode, {
    id: createNodeId("gatsby-plugin-i18n-config"),
    parent: null,
    children: [],
    internal: {
      type: "I18n",
      contentDigest: createContentDigest(configNode),
      content: JSON.stringify(configNode),
      description: "Options for gatsby-plugin-i18n"
    }
  })); // const routesMap = getI18nRoutesMap();
  // createNode({
  //   ...routesMap,
  //   routesMap,
  //   id: createNodeId("gatsby-plugin-i18n-routes"),
  //   parent: null,
  //   children: [],
  //   internal: {
  //     type: "I18nRoutes",
  //     contentDigest: createContentDigest(routesMap),
  //     content: JSON.stringify(routesMap),
  //     description: "Routes by gatsby-plugin-i18n",
  //   },
  // });
};

module.exports = sourceNodes;