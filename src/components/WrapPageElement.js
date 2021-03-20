// @ts-check

import React from "react";
import { IntlProvider } from "react-intl";
import { getOptions } from "../utils/options";
import { logger } from "../utils";
import { I18nProvider } from "./I18nContext";
import I18nSEO from "./I18nSEO";
import i18nRoutes from "../.routes.json";

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
 * @param {import("gatsby").WrapPageElementBrowserArgs<{}, GatsbyI18n.PageContext>} args
 * @param {GatsbyI18n.Options} pluginOptions
 * @returns
 */
const WrapPageElement = ({ element, props }, pluginOptions) => {
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

  if (typeof window !== "undefined") {
    window["___gatsbyI18n"] = { ...i18n, routes: i18nRoutes };
  }

  // polyfillIntl(i18n.currentLocale);

  return (
    <IntlProvider
      locale={i18n.currentLocale}
      defaultLocale={i18n.defaultLocale}
      messages={i18n.messages}
    >
      <I18nProvider value={i18n}>
        <I18nSEO i18n={i18n} location={props.location} />
        {element}
      </I18nProvider>
    </IntlProvider>
  );
};

export default WrapPageElement;
