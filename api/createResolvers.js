// @ts-check

const createResolvers = ({ createResolvers, createContentDigest }) => {
  // const resolvers = {
  //   Mdx: {
  //     body: {
  //       args: {
  //         locale: "String",
  //       },
  //       resolve(source, args, context, info) {
  //         const { locale } = args;
  //         if (locale) {
  //           if (source.frontmatter && source.frontmatter[locale] && source.frontmatter[locale].body) {
  //             const value = source.frontmatter[locale].body;
  //             // Isolate MDX
  //             const mdxType = info.schema.getType('Mdx');
  //             // Grab just the body contents of what MDX generates
  //             const { resolve } = mdxType.getFields().body;

  //             return resolve({
  //               rawBody: value,
  //               internal: {
  //                 contentDigest: createContentDigest(value), // Used for caching
  //               },
  //             }, args, context, info)
  //             // return source.frontmatter[locale].body;
  //           }
  //         }
  //         return source.body || "";
  //       },
  //     }
  //     // url: {
  //     //   type: "String",
  //     //   args: {
  //     //     locale: "String",
  //     //   },
  //     //   resolve(source, args, context, info) {
  //     //     // const a = context.nodeModel.getNodeById("gatsby-plugin-i18n-config");
  //     //     const data = context.nodeModel.runQuery({
  //     //       query: {
  //     //         filter: {
  //     //           routeId: { eq: source.fields.routeId },
  //     //         },
  //     //       },
  //     //       type: "I18nRoute",
  //     //     });
  //     //     console.log("data", data);
  //     //     const urlData = data.fields[args.locale];
  //     //     if (urlData) {
  //     //       return urlData.url;
  //     //     }
  //     //     return "";
  //     //   },
  //     // },
  //     // urlString: {
  //     //   type: "String",
  //     //   args: {
  //     //     locale: "String",
  //     //   },
  //     //   resolve(source, args, context, info) {
  //     //     console.log("loggg info:", info, "source", source, "args", args);
  //     //     // const a = context.nodeModel.getNodeById("gatsby-plugin-i18n-config");
  //     //     const data = context.nodeModel.runQuery({
  //     //       query: {
  //     //         filter: {
  //     //           routeId: { eq: source.fields.routeId },
  //     //         },
  //     //       },
  //     //       type: "I18nRoute",
  //     //     });
  //     //     console.log("data", data);
  //     //     return data.fields[args.locale] || "ciao";
  //     //   },
  //     // },
  //     // urlRoute: {
  //     //   type: ["I18nRoute"],
  //     //   resolve(source, args, context, info) {
  //     //     return context.nodeModel.runQuery({
  //     //       query: {
  //     //         filter: {
  //     //           routeId: { eq: source.fields.routeId },
  //     //         },
  //     //       },
  //     //       type: "I18nRoute",
  //     //     });
  //     //   },
  //     // },
  //   },
  // };
  // createResolvers(resolvers);
};

module.exports = createResolvers;
