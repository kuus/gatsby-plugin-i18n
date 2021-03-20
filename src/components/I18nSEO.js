// @ts-check

import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import { findRouteForPath } from "../utils";
import Helmet from "react-helmet";
import i18nRoutes from "../.routes.json";

/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 *
 * @type {React.FC<{
 *    i18n: GatsbyI18n.PageContext["i18n"];
 *    location: import("@reach/router").WindowLocation;
 * }>}
 */
const I18nSEO = ({ i18n, location }) => {
  const { currentLocale, locales } = i18n;
  const route = findRouteForPath(i18nRoutes, location.pathname);
  const data = useStaticQuery(graphql`
    {
      site {
        siteMetadata {
          siteUrl
        }
      }
    }
  `);
      // i18N {
      //   defaultLocale
      //   locales
      // }

  return (
    <Helmet htmlAttributes={{ lang: currentLocale }}>
      <meta property="og:locale" content={currentLocale.replace("-", "_")} />
      {route &&
        locales
          .filter((locale) => locale !== currentLocale)
          .map((locale) =>
            !!route[locale] ? (
              <React.Fragment key={locale}>
                <link
                  rel="alternate"
                  href={data.site.siteMetadata.siteUrl + route[locale]}
                  hrefLang={locale}
                />
                <meta
                  key={locale}
                  property="og:locale:alternate"
                  content={locale.replace("-", "_")}
                />
              </React.Fragment>
            ) : (
              ""
            )
          )}
    </Helmet>
  );
};

export default I18nSEO;
