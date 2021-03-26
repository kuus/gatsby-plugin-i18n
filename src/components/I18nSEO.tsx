import React from "react";
import Helmet from "react-helmet";
import { useI18n } from "./I18nContext";

/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 */
export const I18nSEO: React.FC<{}> = () => {
  const { defaultLocale, currentLocale, alternates } = useI18n();
  const alternatesDefault = alternates.filter(
    ({ locale }) => locale === defaultLocale
  )[0];

  return (
    <Helmet htmlAttributes={{ lang: currentLocale }}>
      <meta property="og:locale" content={currentLocale.replace("-", "_")} />
      {alternatesDefault && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={alternatesDefault.fullUrl}
        />
      )}
      {alternates.map(({ locale, fullUrl }) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={fullUrl} />
      ))}
      {alternates.map(({ locale }) => (
        <meta
          key={locale}
          property="og:locale:alternate"
          content={locale.replace("-", "_")}
        />
      ))}
    </Helmet>
  );
};
