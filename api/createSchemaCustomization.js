// @ts-check

const { getI18nConfig } = require("../utils/internal");

const createSchemaCustomization = ({ actions, schema, createContentDigest }) => {
  const { createFieldExtension, createTypes } = actions;
  const i18n = getI18nConfig();

  // const typeDefs = [
  //   schema.buildObjectType({
  //     name: "I18nRoute",
  //     fields: {
  //       name: "String!",
  //       firstName: "String!",
  //       email: "String!",
  //       receivedSwag: {
  //         type: "Boolean",
  //         resolve: source => source.receivedSwag || false,
  //       },
  //     },
  //     interfaces: ["Node"],
  //   }),
  // ]
  // createTypes(typeDefs)

  createTypes(`
    type I18n implements Node {
      locales: [String]
      defaultLocale: String
      hideDefaultLocaleInUrl: Boolean
    }
  `);

  createTypes(`
    type I18nRouteFieldsLocale {
      locale: String!
      url: String!
      component: String!
      nodeId: String!
    }

    type I18nRouteFields {
      ${i18n.locales.map(locale => {
        return `${locale}: I18nRouteFieldsLocale`
      })}
    }

    type I18nRoute implements Node {
      routeId: String!
      fields: I18nRouteFields
    }
  `);

  // add `url` on Mdx and File nodes to ease the "link->to" data retrieval
  createFieldExtension({
    name: "url",
    args: {
      locale: "String",
      // defaultValue: i18n.defaultLocale
    },
    extend(options) {
      return {
        args: {
          locale: "String",
        },
        async resolve(source, args, context) {
          const children = await context.nodeModel.getNodesByIds({
            ids: source.children,
            type: "I18nRoute",
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
      };
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
      };
    },
  });

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
      };
    },
  });

  // createFieldExtension({
  //   name: "frontmatter",
  //   args: {
  //     locale: "String",
  //   },
  //   extend() {
  //     return {
  //       args: {
  //         locale: "String",
  //       },
  //       resolve(source, args) {
  //         const { locale } = args;
  //         if (locale) {
  //           if (source.frontmatter && source.frontmatter[locale]) {
  //             return source.frontmatter[locale];
  //           }
  //         }
  //         return source.frontmatter;
  //       },
  //     };
  //   },
  // });

  // createFieldExtension({
  //   name: "bodyl",
  //   args: {
  //     locale: "String",
  //   },
  //   extend() {
  //     return {
  //       args: {
  //         locale: "String",
  //       },
  //       async resolve(source, args, context, info) {
  //         const { locale } = args;
  //         if (locale) {
  //           if (source.frontmatter && source.frontmatter[locale] && source.frontmatter[locale].body) {
  //             const value = source.frontmatter[locale].body;
  //             // Isolate MDX
  //             const mdxType = info.schema.getType('Mdx');
  //             // Grab just the body contents of what MDX generates
  //             const { resolve } = mdxType.getFields().body;
  //             console.log("value", value);

  //             return resolve({
  //               rawBody: value,
  //               internal: {
  //                 contentDigest: createContentDigest(value), // Used for caching
  //               }
  //             }, args, context, info)
  //             // const { body } = await genMDX({ node: { value } })
  //             // return body
  //             // return source.frontmatter[locale].body;
  //           }
  //         }
  //         return source.body || "";
  //       },
  //     };
  //   },
  // });

  // TODO: support also MarkdownRemark other than Mdx?
  createTypes(`
    type Mdx implements Node {
      url: String @url
      locales: [String] @locales
      route: String @route
      # frontmatter: MdxFrontmatter @frontmatter 
      # bodyl: String! @bodyl
    }

    type File implements Node {
      url: String @url
      locales: [String] @locales
      route: String @route
    }
  `);
};

module.exports = createSchemaCustomization;
