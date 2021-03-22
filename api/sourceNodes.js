// @ts-check

const { getI18nOptions, getI18nConfig } = require("../utils/internal");
// const { getOptions } = require("../utils/options");

const sourceNodes = (
  { actions, createContentDigest, createNodeId },
  customOptions
) => {
  const { createNode } = actions;

  // const options = getOptions(customOptions);
  const options = getI18nOptions();
  // const config = require(options.configPath);
  const config = getI18nConfig();

  const configNode = {
    ...options,
    ...config,
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