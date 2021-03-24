// @ts-check

const { logger } = require("../utils");
const {
  getI18nOptions,
  getI18nConfig,
  getTemplateBasename,
  getPage,
} = require("../utils/internal");

/**
 * Here we should create tha same context that we do on `createPages`, it would
 * be better to just create it once here but there is an issue with gatsby that
 * programmatically created pages do not trigger the `onCreatePage` hook,
 * @see https://github.com/gatsbyjs/gatsby/issues/5255
 *
 * The Gatsby docs says in fact: "There is a mechanism in Gatsby to prevent
 * calling onCreatePage for pages created by the same gatsby-node.js to avoid
 * infinite loops/callback."
 *
 * @see https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onCreatePage
 *
 * This function will be implemented by your project,
 * in your `gatsby-node.js`:
 *
 * ```
 * const { onCreatePage } = require("@kuus/gatsby-plugin-i18n/api");
 *
 * exports.onCreatePage = ({ page, actions }) => {
 *   onCreatePage({ page, actions });
 * };
 * ```
 */
const onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions;
  const options = getI18nOptions();
  const config = getI18nConfig();
  const { templateName } = options;
  const oldPage = { ...page };
  const templateBasename = getTemplateBasename(templateName);

  if (page.path.endsWith(`/${templateBasename}/`)) {
    // templates can live alongside content files but they should not be rendered
    // statefully, on their own, they should just be the template components
    // used to render the markdown content file that references it
    deletePage(page);
  } else if (page.path.match(/dev-404/)) {
    // this is gatsby's internal 404 for local dev, it can remain as it is
  } else if (page.path.endsWith("404.html")) {
    // create a 404.html fallback page with default language, anyway with netlify
    // redirects the localised version of the 404 page with a pretty URL should
    // be used by the condition here below
    deletePage(page);
    createPage(getPage(oldPage, config.defaultLocale, "/404.html"));
  } else {
    // always delete pages that are loosely placed as `.js/.tsx` files in
    // `src/pages`. Those recreated and localised in the `createPages` api
    // this only works in tandem with disabling the built-in 
    // `gatsby-plugin-page-creator`, the easier way to set that is by
    // setting it in this theme options
    // {
    //   resolve: "gatsby-plugin-page-creator",
    //   options: {
    //     path: `${__dirname}/src/pages`,
    //     ignore: {
    //       patterns: ["**/*.(js|ts)?(x)"],
    //     },
    //   },
    // },
    if (page.isCreatedByStatefulCreatePages) {
      if (options.debug) {
        logger(
          "info",
          `(onCreatePage) page "${page.path}" is deleted as it has already been localised`
        );
      }

      deletePage(page);
    }
  }
};

module.exports = onCreatePage;
