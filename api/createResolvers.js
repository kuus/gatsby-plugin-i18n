// @ts-check

const createResolvers = ({ createResolvers }) => {
  // const resolvers = {
  //   Mdx: {
  //     url: {
  //       type: "String",
  //       args: {
  //         locale: "String",
  //       },
  //       resolve(source, args, context, info) {
  //         // const a = context.nodeModel.getNodeById("gatsby-plugin-i18n-config");
  //         const data = context.nodeModel.runQuery({
  //           query: {
  //             filter: {
  //               routeId: { eq: source.fields.routeId },
  //             },
  //           },
  //           type: "I18nRoute",
  //         });
  //         console.log("data", data);
  //         const urlData = data.fields[args.locale];
  //         if (urlData) {
  //           return urlData.url;
  //         }
  //         return "";
  //       },
  //     },
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
