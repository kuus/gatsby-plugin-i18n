const webpack = require("webpack");

// exactly as `gatsby-plugin-intl`: @see
// https://github.com/wiziple/gatsby-plugin-intl/blob/master/src/gatsby-node.js
exports.onCreateWebpackConfig = ({ actions, plugins }, pluginOptions) => {
  const {
    redirectComponent = null,
    languages,
    defaultLanguage,
  } = pluginOptions;
  if (!languages.includes(defaultLanguage)) {
    languages.push(defaultLanguage);
  }
  const regex = new RegExp(languages.map((l) => l.split("-")[0]).join("|"));
  actions.setWebpackConfig({
    plugins: [
      plugins.define({
        GATSBY_INTL_REDIRECT_COMPONENT_PATH: JSON.stringify(redirectComponent),
      }),
      new webpack.ContextReplacementPlugin(
        /react-intl[/\\]locale-data$/,
        regex
      ),
    ],
  });
};

exports.onPreBootstrap = require("./onPreBootstrap");
exports.onCreateNode = require("./onCreateNode");
exports.onCreatePage = require("./onCreatePage");
exports.createPages = require("./createPages");
