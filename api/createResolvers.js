// @ts-check

const createResolvers = ({ createResolvers }) => {
  const resolvers = {
    Mdx: {
      urlString: {
        type: "String",
        args: {
          locale: "String",
        },
        resolve(source, args, context, info) {
          console.log("loggg info:", info, "source", source, "args", args);

          // const a = context.nodeModel.getNodeById("gatsby-plugin-i18n-config");

          const data = context.nodeModel.runQuery({
            query: {
              filter: {
                routeId: { eq: source.fields.route },
              },
            },
            type: "I18nRoute",
          });
          console.log("data", data);
          return data.fields[args.locale] || "ciao";
        },
      },
      urlRoute: {
        type: ["I18nRoute"],
        resolve(source, args, context, info) {
          return context.nodeModel.runQuery({
            query: {
              filter: {
                routeId: { eq: source.fields.route },
              },
            },
            type: "I18nRoute",
          });
        },
      },
    },
  };
  createResolvers(resolvers);
  // const resolvers = {
  //   AuthorJson: {
  //     recentPosts: {
  //       type: ["MarkdownRemark"],
  //       resolve(source, args, context, info) {
  //         return context.nodeModel.runQuery({
  //           query: {
  //             filter: {
  //               frontmatter: {
  //                 author: { eq: source.email },
  //                 date: { gt: "2019-01-01" },
  //               },
  //             },
  //           },
  //           type: "MarkdownRemark",
  //           firstOnly: false,
  //         })
  //       },
  //     },
  //   },
  // }
  // createResolvers(resolvers)
};

module.exports = createResolvers;
