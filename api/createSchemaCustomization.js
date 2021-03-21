// @ts-check

const createSchemaCustomization = ({ actions }) => {
  const { createFieldExtension, createTypes } = actions;

  createTypes(`
    type I18n implements Node {
      locales: [String]
      defaultLocale: String
      hideDefaultLocaleInUrl: Boolean
    }
  `);

  // add `url` on Mdx and File nodes without having it nested within the 
  // `fields` object, this is just to easier the "link->to" data retrieval
  // the fields.url is add in the `onCreateNode` api
  createFieldExtension({
    name: "url",
    extend() {
      return {
        resolve(source) {
          if (source.fields.url) {
            return source.fields.url;
          }
          return "";
        },
      }
    },
  })

  createTypes(`
    type Mdx implements Node {
      url: String @url
    }
    type File implements Node {
      url: String @url
    }
  `)

  // code examples from gatsby-theme-i18n:
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
