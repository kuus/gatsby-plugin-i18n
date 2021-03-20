// @ts-check
var webpack = require("webpack");

var _require = require("../utils/internal"),
    getI18nConfig = _require.getI18nConfig; // as `gatsby-plugin-intl`: @see
// https://github.com/wiziple/gatsby-plugin-intl/blob/master/src/gatsby-node.js


var onCreateWebpackConfig = function onCreateWebpackConfig(_ref) {
  var actions = _ref.actions;

  var _getI18nConfig = getI18nConfig(),
      locales = _getI18nConfig.locales;

  var regex = new RegExp(locales.map(function (l) {
    return l.split("-")[0];
  }).join("|"));
  actions.setWebpackConfig({
    plugins: [new webpack.ContextReplacementPlugin(/react-intl[/\\]locale-data$/, regex)]
  });
};

module.exports = onCreateWebpackConfig;