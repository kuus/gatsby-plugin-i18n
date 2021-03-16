// @ts-check

const { getOptions } = require("./options");
const webpack = require("webpack");

// as `gatsby-plugin-intl`: @see
// https://github.com/wiziple/gatsby-plugin-intl/blob/master/src/gatsby-node.js
exports.onCreateWebpackConfig = ({ actions }, pluginOptions) => {
  const { locales } = getOptions(pluginOptions);
  const regex = new RegExp(locales.map((l) => l.split("-")[0]).join("|"));

  actions.setWebpackConfig({
    plugins: [
      new webpack.ContextReplacementPlugin(
        /react-intl[/\\]locale-data$/,
        regex
      ),
    ],
  });
};

exports.onPreBootstrap = require("./onPreBootstrap");
exports.onCreateNode = require("./onCreateNode");
exports.createPages = require("./createPages");
exports.onPostBootstrap = require("./onPostBootstrap");
