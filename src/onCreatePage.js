const { getOptions } = require("./options");
const {
  getPageContextData,
  getTemplateBasename,
  normaliseSlashes,
  addRoutes,
} = require("./utils-plugin");

/**
 * Here we should create tha same context that we do on `createPages`, it would
 * be better to just create it once here but there is an issue with gatsby that
 * programmatically created pages do not trigger the `onCreatePage` hook,
 * @see https://github.com/gatsbyjs/gatsby/issues/5255
 */
const onCreatePage = ({ page, actions }, pluginOptions) => {
  const { createPage, deletePage } = actions;
  const options = getOptions(pluginOptions);
  const { languages, templateName } = options;
  const oldPage = { ...page };
  const templateBasename = getTemplateBasename(templateName);

  if (page.path.endsWith(`/${templateBasename}/`)) {
    // console.log(`Page template "${templateBasename}" is deleted in the hook "onCreatePage"`);
    deletePage(oldPage);
  } else if (page.path.match(/dev-404/)) {
    // console.log(`"onCreatePage" matched dev-404: ${page.path}`);
    createPage(page);
  } else if (page.path === "/404.html") {
    // console.log(`"onCreatePage" matched 404.html: ${page.path}`);
    deletePage(oldPage);
    createPage(getPage(options, page, null, "404.html", "404.html"));
    languages.forEach((lang) => {
      // FIXME: last argument`matchPath` should be "*" ?
      createPage(getPage(options, page, lang, "404.html"));
    });
  } else if (page.path === "/404/") {
    // console.log(`"onCreatePage" matched 404: ${page.path}`);
    deletePage(oldPage);
    createPage(getPage(options, page, null, "404", "404"));
    languages.forEach((lang) => {
      // FIXME: last argument`matchPath` should be "*" ?
      createPage(getPage(options, page, lang, "404"));
    });
  } else {
    // add routes only for pages that loosely placed as `.js/.tsx` files in
    // `src/pages`. For these pages we automatically create the needed localised
    // urls keeping the same slug as the file name (which is what Gatsby uses
    // by default) and the localisation is delegated to the project creator who
    // should use the injectIntl HOC and define the translations in the
    // `src/data/locale/$lang.json` files.
    // For the pages not created this way but instead programmatically created
    // in the `createPages` of your project you need instead to manually
    // create the route object and add it through `gatsby-i18n` API `addRoutes`.
    // if (page.isCreatedByStatefulCreatePages) {
    //   if (options.debug) {
    //     console.log(
    //       `[gatsby-i18n] Page "${page.path}" is deleted in the hook "onCreatePage" and localised`
    //     );
    //   }
    //   deletePage(oldPage);
    //   createPage(getPage(options, page, null, page.path));
    //   let route = {};
    //   languages.forEach(lang => {
    //     const routeKey = normaliseSlashes(`/${page.path}`);
    //     route[routeKey] = route[routeKey] || {};
    //     route[routeKey][lang] = normaliseSlashes(`/${lang}/${page.path}`);
    //     createPage(getPage(options, page, lang, page.path));
    //   });
    //   addRoutes(route);
    // }
  }
};

const getPage = (options, page, lang, path, matchPath) => {
  const hasWildcard = matchPath ? matchPath.indexOf("*") >= 0 : false;
  const data = {
    ...page,
    context: {
      ...page.context,
      ...getPageContextData({ lang, routed: !!lang }),
    },
  };
  path = lang ? `/${lang}/${path}` : `/${path}`;
  data.path = normaliseSlashes(path);

  if (matchPath) {
    matchPath = lang ? `/${lang}/${matchPath}` : `/${matchPath}`;
    // don't add trailing slash to 404 wildcard match path, otherwise we would
    // have the following matchPath value: `/en/*/`
    matchPath = hasWildcard ? matchPath : normaliseSlashes(matchPath);
    data.matchPath = matchPath;
  }

  // console.log(`getPage returns data`, data);

  return data;
};

module.exports = onCreatePage;
