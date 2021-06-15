import React from "react";
import { WrapPageElementBrowserArgs } from "gatsby";
import { IntlProvider } from "react-intl";
import { getOptions } from "../../utils/options";
import { logger } from "../../utils";
import { I18nProvider } from "./I18nContext";
import { I18nSEO } from "./I18nSEO";

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

/**
 * Wrap page element component
 *
 * It wraps everything into the two needed i18n providers and add i18n related
 * SEO by default
 */
export const wrapPageElement = (
  { element, props }: WrapPageElementBrowserArgs<{}, GatsbyI18n.PageContext>,
  pluginOptions: GatsbyI18n.Options
) => {
  if (!props) {
    return;
  }

  const { i18n } = props.pageContext;

  if (!i18n) {
    if (process.env.NODE_ENV === "development") {
      const options = getOptions(pluginOptions);
      if (options.debug) {
        logger(
          "info",
          `No 'i18n' in wrapPageElement props ${props.location.pathname}`
        );
      }
    }

    return element;
  }

  // polyfillIntl(i18n.currentLocale);

  return (
    <IntlProvider
      locale={i18n.currentLocale}
      defaultLocale={i18n.defaultLocale}
      messages={i18n.messages}
    >
      <I18nProvider value={i18n}>
        <I18nSEO />
        {element}
      </I18nProvider>
    </IntlProvider>
  );
};
