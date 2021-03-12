// @ts-check

import React from "react";
import { IntlProvider } from "react-intl";
import { IntlContextProvider } from "./IntlContext";
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

const withIntlProvider = (i18n) => (children) => {
  polyfillIntl(i18n.currentLocale);

  return (
    <IntlProvider
      locale={i18n.currentLocale}
      defaultLocale={i18n.defaultLocale}
      messages={i18n.messages}
    >
      <IntlContextProvider value={i18n}>{children}</IntlContextProvider>
    </IntlProvider>
  );
};

/**
 * Get current locale from URL pathname
 *
 * it grabs the first bit of the pathname and check that that is one of the
 * available locales
 *
 * @param {string} pathname
 * @param {string[]} locales
 * @returns {string | false}
 */
function getCurrentLocaleFromURL(pathname, locales) {
  const parts = pathname.split("/");
  if (parts[1]) {
    for (let i = 0; i < locales.length; i++) {
      if (locales[i] === parts[1]) {
        return parts[1];
      }
    }
  }

  return false;
}

/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * The canonical link tag is oly be added on the non-canonical url,
 * the one the duplicates the original one, for instance, having a default
 * locale set to "it" and having these two URLS:
 * "https://mysite.com/it/chi-siamo"
 * "https://mysite.com/chi-siamo"
 * the first one is considered the canonical URL, hence in the latter URL we
 * add `<link rel="canonical" href="https://mysite.com/it/chi-siamo" />`
 * @see https://support.google.com/webmasters/answer/139066#methods
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 */
const I18nSEO = ({ i18n, location, options }) => {
  const { currentLocale, defaultLocale, locales } = i18n;
  const route = findRouteForPath(i18nRoutes, location.pathname);
  const baseUrl = options.baseUrl;
  const currentLocaleInUrl = getCurrentLocaleFromURL(
    location.pathname,
    locales
  );

  if (!route) {
    return <Helmet htmlAttributes={{ lang: currentLocale }} />;
  }
  const canonicalUrl = baseUrl + route[defaultLocale];
  const showCanonical = currentLocale === defaultLocale || !currentLocaleInUrl;

  return (
    <Helmet htmlAttributes={{ lang: currentLocale }}>
      {showCanonical && <link rel="canonical" href={canonicalUrl} />}
      {locales.map((locale) =>
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

  if (!i18n || !props.location) {
    if (options.debug) {
      if (!props.location) {
        logger("info", "No 'location' in WrapPageElement props", props);
      }
      else if (!i18n) {
        logger("info", "No 'i18n' in WrapPageElement props", props.location.pathname);
      }
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

  return withIntlProvider(i18n)(renderElementWithSeo);
};

export default WrapPageElement;
