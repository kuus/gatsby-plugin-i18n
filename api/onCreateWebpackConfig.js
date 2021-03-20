// @ts-check

const webpack = require("webpack");
const { getI18nConfig } = require("../utils/internal");

// as `gatsby-plugin-intl`: @see
// https://github.com/wiziple/gatsby-plugin-intl/blob/master/src/gatsby-node.js
const onCreateWebpackConfig = ({ actions }) => {
  const { locales } = getI18nConfig();
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

module.exports = onCreateWebpackConfig;
