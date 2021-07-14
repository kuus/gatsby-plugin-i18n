// TODO: schema validation for options with defaults set here
const pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    // optionA: Joi.boolean().required().description(`Enables optionA.`),
    // message: Joi.string()
    //   .default(`default message`)
    //   .description(`The message logged to the console.`),
    // optionB: Joi.boolean().description(`Enables optionB.`),
    // debug: Joi.boolean().default(false),
    // // paths
    // configPath: "src/content/settings/i18n/config.yml",
    // messagesPath: "src/content/settings/i18n/messages",
    // contentPaths: ["src/pages", "src/content"],
    // // excludePaths: ["admin"],
    // excludePaths: [],
    // templateName: "tpl.tsx",
    // untranslatedComponent: null,
    // useMdx: true,
    // frontmatterKeyForLocalisedSlug: "slug",
    // frontmatterKeyForIdentifier: "identifier",
    // // netlify/server related options:
    // hasSplatRedirects: true,
  });
};

module.exports = pluginOptionsSchema;
