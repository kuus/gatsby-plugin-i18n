const {
  writeConfig,
  ensureLocalisedMessagesFiles,
  cleanRoutes,
} = require("./utils-plugin");

const onPreBootstrap = (args, pluginOptions) => {
  // writeConfig(pluginOptions);
  ensureLocalisedMessagesFiles(pluginOptions);
  cleanRoutes();
};

module.exports = onPreBootstrap;
