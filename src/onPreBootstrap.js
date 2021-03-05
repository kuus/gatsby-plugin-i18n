const {
  writeI18nOptions,
  ensureLocalisedMessagesFiles,
  cleanI18nRoutesMap,
} = require("./utils-plugin");

const onPreBootstrap = (args, pluginOptions) => {
  writeI18nOptions(pluginOptions);
  ensureLocalisedMessagesFiles(pluginOptions);
  cleanI18nRoutesMap();
};

module.exports = onPreBootstrap;
