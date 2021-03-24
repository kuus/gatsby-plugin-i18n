// @ts-check

const { getI18nConfig } = require("../utils/internal");

const createSchemaCustomization = ({ actions }) => {
  const { createFieldExtension, createTypes } = actions;
  const config = getI18nConfig();

  createTypes(`
    type I18n implements Node {
      locales: [String]
      defaultLocale: String
      hideDefaultLocaleInUrl: Boolean
    }
  `);

  createTypes(`
    type I18nRoute implements Node {
      routeId: String!
    }
  `);

  createTypes(`
    type I18nRouteUrl {
      locale: String
      url: String
    }
  `);

  // add `url` on Mdx and File nodes to ease the "link->to" data retrieval
  createFieldExtension({
    name: "url",
    args: {
      locale: "String",
      // defaultValue: config.defaultLocale
    },
    extend(options) {
      return {
        args: {
          locale: "String",
        },
        async resolve(source, args, context) {
          const children = await context.nodeModel.getNodesByIds({
            ids: source.children,
            type: "I18nRoute"
          });
          const childRoute = children[0];
          
          if (childRoute) {
            const fields = childRoute.fields || {};
            const locale = args.locale != null ? args.locale : options.locale;
            // const 
            if (fields[locale]) {
              return fields[locale].url;
            }
          }
            
          return null;
        },
      }
    },
  });

  // add `locales` on Mdx and File nodes without having it nested within the 
  // `fields` object, this is just to easier the "link->to" data retrieval
  // Note: the fields.locale_{locale} is add in the `onCreateNode` api
  createFieldExtension({
    name: "locales",
    extend() {
      return {
        resolve(source) {
          if (source.fields) {
            const locales = [];
            for (const key in source.fields) {
              const fieldNameParts = key.split("_");
              if (fieldNameParts[0] === "locale") {
                locales.push(fieldNameParts[1]);
              }
            }
            return locales;
          }
          return null;
        },
      }
    },
  })


  // add `isRoute` on Mdx and File nodes this is just to easier the filtering
  // in the queries when wanting to retrieve route links
  createFieldExtension({
    name: "route",
    extend() {
      return {
        resolve(source) {
          if (source.fields && source.fields.routeId) {
            return source.fields.routeId;
          }
          return null;
        },
      }
    },
  })

  // TODO: support also MarkdownRemark other than Mdx?
  createTypes(`
    type Mdx implements Node {
      url: String @url
      locales: [String] @locales
      route: Boolean @route
    }
    type File implements Node {
      url: String @url
      locales: [String] @locales
      route: String @route
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
