// @ts-check

const { getOptions } = require("../utils/options");
const { getI18nConfig } = require("../utils/internal");

const sourceNodes = (
  { actions, createContentDigest, createNodeId },
  pluginOptions
) => {
  const { createNode } = actions;

  const options = getOptions(pluginOptions);
  // const i18n = require(options.configPath);
  const i18n = getI18nConfig();

  const configNode = {
    ...options,
    ...i18n,
  };

  createNode({
    ...configNode,
    id: createNodeId("gatsby-plugin-i18n-config"),
    parent: null,
    children: [],
    internal: {
      type: "I18n",
      contentDigest: createContentDigest(configNode),
      content: JSON.stringify(configNode),
      description: "Options for gatsby-plugin-i18n",
    },
  });
};

module.exports = sourceNodes;
