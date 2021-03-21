// @ts-check

exports.onCreateWebpackConfig = require("./api/onCreateWebpackConfig");
exports.onPreBootstrap = require("./api/onPreBootstrap");
exports.createSchemaCustomization = require("./api/createSchemaCustomization");
// exports.sourceNodes = require("./api/sourceNodes");
exports.onCreateNode = require("./api/onCreateNode");
exports.createPages = require("./api/createPages");
// exports.onCreatePages = require("./api/onCreatePages");
exports.createResolvers = require("./api/createResolvers");
exports.onPostBootstrap = require("./api/onPostBootstrap");
