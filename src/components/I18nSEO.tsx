import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import Helmet from "react-helmet";
import { getCurrentRoute } from "../helpers";
import { useI18n } from "./I18nContext";

/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 */
export const I18nSEO: React.FC<{}> = () => {
  const route = getCurrentRoute();
  const { currentLocale, locales } = useI18n();
  const data = useStaticQuery(graphql`
    {
      site {
        siteMetadata {
          siteUrl
        }
      }
    }
  `);
  const baseUrl = data.site.siteMetadata.siteUrl;
  const alternateLocales = route
    ? locales.filter((locale) => locale !== currentLocale && !!route[locale])
    : [];

  return (
    <Helmet htmlAttributes={{ lang: currentLocale }}>
      <meta property="og:locale" content={currentLocale.replace("-", "_")} />
      {locales.length > 1 && (
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />
      )}
      {alternateLocales.map((locale) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={baseUrl + route[locale]}
        />
      ))}
      {alternateLocales.map((locale) => (
        <meta
          key={locale}
          property="og:locale:alternate"
          content={locale.replace("-", "_")}
        />
      ))}
    </Helmet>
  );
};
