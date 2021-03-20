// @ts-check
var createSchemaCustomization = function createSchemaCustomization(_ref) {
  var actions = _ref.actions;
  var createTypes = actions.createTypes;
  createTypes("\n    type I18n implements Node {\n      locales: [String]\n      defaultLocale: String\n      hideDefaultLocaleInUrl: Boolean\n    }\n  "); // createTypes(`
  //   type I18nRoute implements Node {
  //     locales: [String]
  //     defaultLocale: String
  //     hideDefaultLocaleInUrl: Boolean
  //   }
  // `);
  // createTypes(`
  //   type I18n implements Node {
  //     locales: [String]
  //     defaultLocale: String
  //     hideDefaultLocaleInUrl: Boolean
  //     configPath: String
  //     config: [Locale]
  //   }
  //   type Locale {
  //     code: String
  //     hrefLang: String
  //     dateFormat: String
  //     langDir: String
  //     localName: String
  //     name: String
  //   }
  // `)
};

module.exports = createSchemaCustomization;