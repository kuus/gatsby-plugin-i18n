const { writeConfig, cleanRoutes } = require("./utils-plugin");

const onPreBootstrap = (args, pluginOptions) => {
  writeConfig(pluginOptions);
  cleanRoutes();
};

module.exports = onPreBootstrap;
