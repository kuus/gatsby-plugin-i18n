// @ts-check

import React from "react";
import { IntlProvider } from "react-intl";
import { I18nProvider } from "./I18nContext";
import { getOptions } from "./options";
import { logger } from "./utils";
import Helmet from "react-helmet";
import { findRouteForPath } from "./utils";
import i18nRoutes from "./.routes.json";

const polyfillIntl = (locale) => {
  locale = locale.split("-")[0];
  // try {
  //   if (!Intl.PluralRules) {
  //     require("@formatjs/intl-pluralrules/polyfill");
  //     require(`@formatjs/intl-pluralrules/dist/locale-data/${locale}`);
  //   }

  //   if (!Intl.RelativeTimeFormat) {
  //     require("@formatjs/intl-relativetimeformat/polyfill");
  //     require(`@formatjs/intl-relativetimeformat/dist/locale-data/${locale}`);
  //   }
  // } catch (e) {
  //   throw new Error(`Cannot find react-intl/locale-data/${locale}`);
  // }
};

const withI18nProviders = (i18n) => (children) => {
  // polyfillIntl(i18n.currentLocale);

  return (
    <IntlProvider
      locale={i18n.currentLocale}
      defaultLocale={i18n.defaultLocale}
      messages={i18n.messages}
    >
      <I18nProvider value={i18n}>{children}</I18nProvider>
    </IntlProvider>
  );
};

/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 */
const I18nSEO = ({ i18n, location, options }) => {
  const { currentLocale, locales } = i18n;
  const route = findRouteForPath(i18nRoutes, location.pathname);
  const baseUrl = options.baseUrl;

  if (!route) {
    return <Helmet htmlAttributes={{ lang: currentLocale }} />;
  }

  return (
    <Helmet htmlAttributes={{ lang: currentLocale }}>
      {locales
        .filter((locale) => locale !== currentLocale)
        .map((locale) =>
          !!route[locale] ? (
            <link
              rel="alternate"
              href={baseUrl + route[locale]}
              hrefLang={locale}
              key={locale}
            />
          ) : (
            ""
          )
        )}
    </Helmet>
  );
};

const WrapPageElement = ({ element, props }, pluginOptions) => {
  if (!props) {
    return;
  }

  const { i18n } = props.pageContext;
  const options = getOptions(pluginOptions);

  if (!i18n) {
    if (options.debug) {
      logger(
        "info",
        `No 'i18n' in WrapPageElement props ${props.location.pathname}`
      );
    }
    return element;
  }

  if (typeof window !== "undefined") {
    window["___gatsbyI18n"] = { ...i18n, routes: i18nRoutes };
  }

  const renderElementWithSeo = (
    <>
      <I18nSEO i18n={i18n} location={props.location} options={options} />
      {element}
    </>
  );

  return withI18nProviders(i18n)(renderElementWithSeo);
};

export default WrapPageElement;
