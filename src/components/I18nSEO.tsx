import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import Helmet from "react-helmet";
import { useI18n } from "./I18nContext";
import { getCurrentRoute } from "../helpers";

/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 */
export const I18nSEO: React.FC<{}> = () => {
  const route = getCurrentRoute();
  if (!route) {
    return null;
  }
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
  const alternateLocales = route.locales
    ? locales.filter((locale) => locale !== currentLocale && !!route.locales[locale])
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
          href={baseUrl + route.locales[locale]}
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
