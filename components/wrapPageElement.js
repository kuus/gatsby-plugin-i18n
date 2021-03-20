var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _reactIntl = require("react-intl");

var _I18nContext = require("./I18nContext");

var _options = require("./utils/options");

var _utils = require("./utils");

var _reactHelmet = _interopRequireDefault(require("react-helmet"));

var _routes = _interopRequireDefault(require("./.routes.json"));

// @ts-check
var polyfillIntl = function polyfillIntl(locale) {
  locale = locale.split("-")[0]; // try {
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

var withI18nProviders = function withI18nProviders(i18n) {
  return function (children) {
    // polyfillIntl(i18n.currentLocale);
    return /*#__PURE__*/_react.default.createElement(_reactIntl.IntlProvider, {
      locale: i18n.currentLocale,
      defaultLocale: i18n.defaultLocale,
      messages: i18n.messages
    }, /*#__PURE__*/_react.default.createElement(_I18nContext.I18nProvider, {
      value: i18n
    }, children));
  };
};
/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 */


var I18nSEO = function I18nSEO(_ref) {
  var i18n = _ref.i18n,
      location = _ref.location,
      options = _ref.options;
  var currentLocale = i18n.currentLocale,
      locales = i18n.locales;
  var route = (0, _utils.findRouteForPath)(_routes.default, location.pathname);
  var baseUrl = options.baseUrl;
  return /*#__PURE__*/_react.default.createElement(_reactHelmet.default, {
    htmlAttributes: {
      lang: currentLocale
    }
  }, /*#__PURE__*/_react.default.createElement("meta", {
    property: "og:locale",
    content: currentLocale.replace("-", "_")
  }), route && locales.filter(function (locale) {
    return locale !== currentLocale;
  }).map(function (locale) {
    return !!route[locale] ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, {
      key: locale
    }, /*#__PURE__*/_react.default.createElement("link", {
      rel: "alternate",
      href: baseUrl + route[locale],
      hrefLang: locale
    }), /*#__PURE__*/_react.default.createElement("meta", {
      key: locale,
      property: "og:locale:alternate",
      content: locale.replace("-", "_")
    })) : "";
  }));
};

var WrapPageElement = function WrapPageElement(_ref2, pluginOptions) {
  var element = _ref2.element,
      props = _ref2.props;

  if (!props) {
    return;
  }

  var i18n = props.pageContext.i18n;
  var options = (0, _options.getOptions)(pluginOptions);

  if (!i18n) {
    if (options.debug) {
      (0, _utils.logger)("info", "No 'i18n' in WrapPageElement props " + props.location.pathname);
    }

    return element;
  }

  if (typeof window !== "undefined") {
    window["___gatsbyI18n"] = (0, _extends2.default)({}, i18n, {
      routes: _routes.default
    });
  }

  var renderElementWithSeo = /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(I18nSEO, {
    i18n: i18n,
    location: props.location,
    options: options
  }), element);

  return withI18nProviders(i18n)(renderElementWithSeo);
};

var _default = WrapPageElement;
exports.default = _default;