import React from "react";
import { WrapPageElementBrowserArgs } from "gatsby";
import { IntlProvider } from "react-intl";
import { getOptions } from "../../utils/options";
import { logger } from "../../utils";
import { I18nProvider } from "./I18nContext";
import I18nSEO from "./I18nSEO";
import { GatsbyI18n } from "../types";

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
 */
const WrapPageElement = (
  { element, props }: WrapPageElementBrowserArgs<{}, GatsbyI18n.PageContext>,
  pluginOptions: GatsbyI18n.Options
) => {
  if (!props) {
    return;
  }

  const { i18n } = props.pageContext;

  if (!i18n) {
    const options = getOptions(pluginOptions);
    if (options.debug) {
      logger(
        "info",
        `No 'i18n' in WrapPageElement props ${props.location.pathname}`
      );
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
        <I18nSEO i18n={i18n} />
        {element}
      </I18nProvider>
    </IntlProvider>
  );
};

export default WrapPageElement;
