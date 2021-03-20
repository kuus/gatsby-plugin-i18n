// @ts-check

const createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  createTypes(`
    type I18n implements Node {
      locales: [String]
      defaultLocale: String
      hideDefaultLocaleInUrl: Boolean
    }
  `);

  // createTypes(`
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
