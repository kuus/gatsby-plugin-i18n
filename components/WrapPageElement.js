var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _reactIntl = require("react-intl");

var _options = require("../utils/options");

var _utils = require("../utils");

var _I18nContext = require("./I18nContext");

var _I18nSEO = _interopRequireDefault(require("./I18nSEO"));

var _routes = _interopRequireDefault(require("../.routes.json"));

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
/**
 * Wrap page element component
 *
 * @param {import("gatsby").WrapPageElementBrowserArgs<{}, GatsbyI18n.PageContext>} args
 * @param {GatsbyI18n.Options} pluginOptions
 * @returns
 */


var WrapPageElement = function WrapPageElement(_ref, pluginOptions) {
  var element = _ref.element,
      props = _ref.props;

  if (!props) {
    return;
  }

  var i18n = props.pageContext.i18n;

  if (!i18n) {
    var options = (0, _options.getOptions)(pluginOptions);

    if (options.debug) {
      (0, _utils.logger)("info", "No 'i18n' in WrapPageElement props " + props.location.pathname);
    }

    return element;
  }

  if (typeof window !== "undefined") {
    window["___gatsbyI18n"] = (0, _extends2.default)({}, i18n, {
      routes: _routes.default
    });
  } // polyfillIntl(i18n.currentLocale);


  return /*#__PURE__*/_react.default.createElement(_reactIntl.IntlProvider, {
    locale: i18n.currentLocale,
    defaultLocale: i18n.defaultLocale,
    messages: i18n.messages
  }, /*#__PURE__*/_react.default.createElement(_I18nContext.I18nProvider, {
    value: i18n
  }, /*#__PURE__*/_react.default.createElement(_I18nSEO.default, {
    i18n: i18n,
    location: props.location
  }), element));
};

var _default = WrapPageElement;
exports.default = _default;