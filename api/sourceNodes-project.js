// @ts-check

const { getI18nRoutes } = require("../utils/internal");

const sourceNodes = ({ actions, createContentDigest, createNodeId }) => {
  const { createNode } = actions;

  const routesMap = getI18nRoutes();

  createNode({
    ...routesMap,
    id: createNodeId("gatsby-plugin-i18n-links"),
    parent: null,
    children: [],
    internal: {
      type: "I18nLinks",
      contentDigest: createContentDigest(routesMap),
      content: JSON.stringify(routesMap),
      description: "Links map from gatsby-plugin-i18n",
    },
  });
};

module.exports = sourceNodes;
